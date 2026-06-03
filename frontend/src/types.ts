export type RunStatus =
  | "idle"
  | "loading"
  | "running"
  | "succeeded"
  | "stuck"
  | "step_cap"
  | "cost_cap"
  | "timeout"
  | "error";

export type PastRun = {
  id: string;
  goal: string;
};

export type TimelineStep = {
  id: string;
  title: string;
  detail?: string;
};
