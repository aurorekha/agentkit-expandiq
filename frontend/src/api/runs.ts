export type RunSummary = {
  id: string;
  goal: string;
  status: string;
  reason: string | null;
  total_cost: number;
  final_answer: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type RunStep = {
  id: number;
  run_id: string;
  step_number: number;
  tool_name: string | null;
  args_json: string | null;
  result_json: string | null;
  cost: number;
  created_at: string | null;
};

export type RunDetail = {
  run: RunSummary;
  steps: RunStep[];
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) {
      return body.error;
    }
  } catch {
    // ignore parse errors
  }
  return `Request failed (${response.status})`;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export function createRun(goal: string): Promise<{ run_id: string }> {
  return apiFetch("/runs", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

export function listRuns(): Promise<RunSummary[]> {
  return apiFetch("/runs");
}

export function getRun(runId: string): Promise<RunDetail> {
  return apiFetch(`/runs/${runId}`);
}
