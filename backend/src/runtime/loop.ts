import {
  createStep,
  getRun,
  getSteps,
  updateRun,
  type Run,
  type Step,
} from "../db/client.js";
import { getTool, type ToolResult } from "../tools/registry.js";
import { mockLlm, type PastStep } from "./mock-llm.js";
import { retrieveTools } from "./retrieval.js";

const TIMEOUT_MS = 60_000;
const TOP_K_TOOLS = 5;

export type RunAgentInput = {
  runId: string;
  goal: string;
  maxSteps?: number;
  maxCostUsd?: number;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function toPastSteps(steps: Step[]): PastStep[] {
  return steps.map((step) => ({
    tool_name: step.tool_name,
    args_json: step.args_json,
    result_json: step.result_json,
  }));
}

function isStuck(steps: Step[]): boolean {
  if (steps.length < 3) {
    return false;
  }
  const lastThree = steps.slice(-3);
  const signature = `${lastThree[0].tool_name}\0${lastThree[0].args_json}`;
  return lastThree.every(
    (step) => `${step.tool_name}\0${step.args_json}` === signature,
  );
}

export function executeToolWithRetry(
  toolName: string,
  args: Record<string, unknown>,
): ToolResult {
  const tool = getTool(toolName);
  if (!tool) {
    return {
      ok: false,
      data: null,
      error: {
        code: "TOOL_NOT_FOUND",
        message: `Unknown tool: ${toolName}`,
        recoverable: false,
      },
    };
  }

  const result = tool.execute(args);
  if (result.ok || !result.error?.recoverable) {
    return result;
  }

  return tool.execute(args);
}

function finishRun(
  runId: string,
  status: string,
  totalCost: number,
  options: { reason?: string | null; final_answer?: string | null } = {},
): Run {
  const reason =
    options.reason !== undefined ? options.reason : status === "succeeded" ? null : status;

  const updated = updateRun(runId, {
    status,
    reason,
    total_cost: totalCost,
    final_answer: options.final_answer ?? null,
    finished_at: new Date().toISOString(),
  });

  if (!updated) {
    throw new Error(`Run not found: ${runId}`);
  }

  return updated;
}

export function runAgent(input: RunAgentInput): Run {
  const {
    runId,
    goal,
    maxSteps = 20,
    maxCostUsd = 0.5,
  } = input;

  const existing = getRun(runId);
  if (!existing) {
    throw new Error(`Run not found: ${runId}`);
  }

  const startedAt = Date.now();
  let totalCost = existing.total_cost;

  while (true) {
    if (Date.now() - startedAt > TIMEOUT_MS) {
      return finishRun(runId, "timeout", totalCost);
    }

    const steps = getSteps(runId);

    if (steps.length >= maxSteps) {
      return finishRun(runId, "step_cap", totalCost);
    }

    if (totalCost >= maxCostUsd) {
      return finishRun(runId, "cost_cap", totalCost);
    }

    if (isStuck(steps)) {
      return finishRun(runId, "stuck", totalCost);
    }

    const candidateTools = retrieveTools(goal, TOP_K_TOOLS);
    const llmOutput = mockLlm({
      goal,
      pastSteps: toPastSteps(steps),
      candidateTools,
    });

    totalCost += llmOutput.cost;

    if (totalCost >= maxCostUsd) {
      return finishRun(runId, "cost_cap", totalCost);
    }

    if (llmOutput.type === "final") {
      return finishRun(runId, "succeeded", totalCost, {
        reason: null,
        final_answer: llmOutput.content,
      });
    }

    const argsJson = stableJson(llmOutput.args);
    const result = executeToolWithRetry(llmOutput.tool, llmOutput.args);

    if (!result.ok) {
      createStep({
        run_id: runId,
        step_number: steps.length + 1,
        tool_name: llmOutput.tool,
        args_json: argsJson,
        result_json: stableJson(result),
        cost: llmOutput.cost,
      });
      return finishRun(runId, "error", totalCost);
    }

    createStep({
      run_id: runId,
      step_number: steps.length + 1,
      tool_name: llmOutput.tool,
      args_json: argsJson,
      result_json: stableJson(result),
      cost: llmOutput.cost,
    });

    updateRun(runId, { status: "running", total_cost: totalCost });
  }
}
