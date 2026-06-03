import type { Tool } from "../tools/registry.js";

const TOOL_CALL_COST = 0.002;
const FINAL_COST = 0.001;

const STUCK_SEARCH_ARGS = { query: "stuck" } as const;

export type PastStep = {
  tool_name: string | null;
  args_json: string | null;
  result_json: string | null;
};

export type MockLlmInput = {
  goal: string;
  pastSteps: PastStep[];
  candidateTools: Tool[];
};

export type MockLlmToolCall = {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
  cost: number;
};

export type MockLlmFinal = {
  type: "final";
  content: string;
  cost: number;
};

export type MockLlmOutput = MockLlmToolCall | MockLlmFinal;

type Scenario = "docs" | "weather" | "stuck" | "email" | "default";

type PlannedStep =
  | { kind: "tool"; tool: string; args: Record<string, unknown> }
  | { kind: "final"; content: string };

function goalIncludes(goal: string, term: string): boolean {
  return goal.toLowerCase().includes(term);
}

function resolveScenario(goal: string): Scenario {
  if (goalIncludes(goal, "stuck")) {
    return "stuck";
  }
  if (goalIncludes(goal, "docs") || goalIncludes(goal, "policy")) {
    return "docs";
  }
  if (goalIncludes(goal, "weather")) {
    return "weather";
  }
  if (goalIncludes(goal, "email")) {
    return "email";
  }
  return "default";
}

function candidateToolNames(candidateTools: Tool[]): Set<string> {
  return new Set(candidateTools.map((tool) => tool.name));
}

function docsQuery(goal: string): string {
  if (goalIncludes(goal, "policy")) {
    return "policy";
  }
  return "docs";
}

function webSearchQuery(goal: string): string {
  const tokens = goal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
  return tokens[0] ?? "agentkit";
}

function getPlannedSteps(goal: string, scenario: Scenario): PlannedStep[] {
  switch (scenario) {
    case "docs":
      return [
        { kind: "tool", tool: "search_docs", args: { query: docsQuery(goal) } },
        { kind: "tool", tool: "fetch_doc", args: { doc_id: "doc-onboarding" } },
        {
          kind: "tool",
          tool: "summarise_text",
          args: { text: "AgentKit onboarding and policy documentation." },
        },
        {
          kind: "final",
          content:
            "Documentation review complete: searched docs, fetched an article, and produced a summary.",
        },
      ];
    case "weather":
      return [
        { kind: "tool", tool: "fetch_weather", args: { city: "Melbourne" } },
        {
          kind: "final",
          content:
            "Weather check complete for Melbourne (including retry after temporary unavailability).",
        },
      ];
    case "stuck":
      return [
        {
          kind: "tool",
          tool: "search_docs",
          args: { ...STUCK_SEARCH_ARGS },
        },
      ];
    case "email":
      return [
        { kind: "tool", tool: "lookup_contact", args: { query: "team" } },
        {
          kind: "tool",
          tool: "send_email",
          args: {
            recipient: "alex.chen@example.com",
            subject: "AgentKit update",
            body: "Following up on your request.",
          },
        },
        {
          kind: "final",
          content:
            "Email workflow complete: contact looked up and message queued for delivery.",
        },
      ];
    default:
      return [
        { kind: "tool", tool: "web_search", args: { query: webSearchQuery(goal) } },
        {
          kind: "final",
          content: "Web search complete and answer prepared from top results.",
        },
      ];
  }
}

function toolCall(
  tool: string,
  args: Record<string, unknown>,
): MockLlmToolCall {
  return { type: "tool_call", tool, args, cost: TOOL_CALL_COST };
}

function finalAnswer(content: string): MockLlmFinal {
  return { type: "final", content, cost: FINAL_COST };
}

export function mockLlm(input: MockLlmInput): MockLlmOutput {
  const { goal, pastSteps, candidateTools } = input;
  const allowed = candidateToolNames(candidateTools);
  const scenario = resolveScenario(goal);
  const plan = getPlannedSteps(goal, scenario);
  const stepIndex = pastSteps.length;

  if (scenario === "stuck") {
    if (allowed.has("search_docs")) {
      return toolCall("search_docs", { ...STUCK_SEARCH_ARGS });
    }
    return finalAnswer("Unable to continue: search_docs is not available.");
  }

  for (let i = stepIndex; i < plan.length; i++) {
    const step = plan[i];
    if (step.kind === "final") {
      return finalAnswer(step.content);
    }
    if (allowed.has(step.tool)) {
      return toolCall(step.tool, step.args);
    }
  }

  const lastFinal = [...plan].reverse().find((step) => step.kind === "final");
  if (lastFinal && lastFinal.kind === "final") {
    return finalAnswer(lastFinal.content);
  }

  return finalAnswer("Run complete.");
}
