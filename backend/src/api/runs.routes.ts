import type { FastifyInstance } from "fastify";
import { createRun, getRun, getSteps, listRuns } from "../db/client.js";
import { runAgent } from "../runtime/loop.js";

type CreateRunBody = {
  goal?: unknown;
  max_steps?: unknown;
  max_cost_usd?: unknown;
};

function parseGoal(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const goal = value.trim();
  return goal.length > 0 ? goal : null;
}

function parsePositiveNumber(
  value: unknown,
  fallback: number,
): number | null {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

function toRunSummary(run: {
  id: string;
  goal: string;
  status: string;
  reason: string | null;
  total_cost: number;
  final_answer: string | null;
  started_at: string | null;
  finished_at: string | null;
}) {
  return {
    id: run.id,
    goal: run.goal,
    status: run.status,
    reason: run.reason,
    total_cost: run.total_cost,
    final_answer: run.final_answer,
    started_at: run.started_at,
    finished_at: run.finished_at,
  };
}

export async function registerRunRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CreateRunBody }>("/runs", async (request, reply) => {
    const goal = parseGoal(request.body?.goal);
    if (!goal) {
      return reply.status(400).send({ error: "goal must be a non-empty string" });
    }

    const maxSteps = parsePositiveNumber(request.body?.max_steps, 20);
    if (maxSteps === null) {
      return reply
        .status(400)
        .send({ error: "max_steps must be a positive number" });
    }

    const maxCostUsd = parsePositiveNumber(request.body?.max_cost_usd, 0.5);
    if (maxCostUsd === null) {
      return reply
        .status(400)
        .send({ error: "max_cost_usd must be a positive number" });
    }

    const run = createRun(goal);
    runAgent({
      runId: run.id,
      goal,
      maxSteps,
      maxCostUsd,
    });

    return { run_id: run.id };
  });

  app.get("/runs", async () => {
    return listRuns().map(toRunSummary);
  });

  app.get<{ Params: { run_id: string } }>(
    "/runs/:run_id",
    async (request, reply) => {
      const run = getRun(request.params.run_id);
      if (!run) {
        return reply.status(404).send({ error: "run not found" });
      }

      return {
        run: toRunSummary(run),
        steps: getSteps(run.id),
      };
    },
  );
}
