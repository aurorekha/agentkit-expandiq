export type RunStatus = "idle" | "running" | "completed" | "failed";

export type PastRun = {
  id: string;
  goal: string;
};

export type TimelineStep = {
  id: string;
  title: string;
  detail?: string;
};
