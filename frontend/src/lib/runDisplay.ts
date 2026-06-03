import type { RunStep, RunSummary } from "../api/runs";
import type { TimelineStep } from "../types";

const TOOL_LABELS: Record<string, string> = {
  search_docs: "Searched documents",
  fetch_doc: "Fetched document",
  summarise_text: "Summarised text",
  fetch_weather: "Checked weather",
  lookup_contact: "Looked up contact",
  send_email: "Prepared email",
  web_search: "Searched the web",
};

const HIDDEN_GOALS = new Set(["test goal", "hello", "hello world"]);

const TERMINAL_MESSAGES: Record<string, string> = {
  stuck:
    "The agent stopped because it repeated the same action too many times.",
  step_cap: "The agent reached the maximum number of steps.",
  cost_cap: "The agent reached the budget limit for this run.",
  timeout: "The run timed out.",
  error: "The run stopped because a tool returned an unrecoverable error.",
};

export function isHiddenRun(run: RunSummary): boolean {
  const normalizedGoal = run.goal.trim().toLowerCase();
  return HIDDEN_GOALS.has(normalizedGoal) || run.status === "completed";
}

export function filterVisibleRuns(runs: RunSummary[]): RunSummary[] {
  return runs.filter((run) => !isHiddenRun(run));
}

export function toolLabel(toolName: string | null): string {
  if (!toolName) {
    return "Completed step";
  }
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
}

export function stepsToTimeline(steps: RunStep[]): TimelineStep[] {
  return steps.map((step) => ({
    id: String(step.id),
    title: toolLabel(step.tool_name),
    detail: step.created_at
      ? new Date(step.created_at).toLocaleString()
      : undefined,
  }));
}

export function getFinalAnswerDisplay(run: RunSummary | null): string | null {
  if (!run) {
    return null;
  }
  if (run.status === "succeeded" || run.status === "completed") {
    return run.final_answer;
  }
  return TERMINAL_MESSAGES[run.status] ?? null;
}
