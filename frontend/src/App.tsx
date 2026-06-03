import { useEffect, useState } from "react";
import { createRun, getRun, listRuns, type RunSummary } from "./api/runs";
import { FinalAnswer } from "./components/FinalAnswer";
import { GoalForm } from "./components/GoalForm";
import { PastRunsList } from "./components/PastRunsList";
import { RunTimeline } from "./components/RunTimeline";
import { StatusBanner } from "./components/StatusBanner";
import {
  filterVisibleRuns,
  getFinalAnswerDisplay,
  stepsToTimeline,
} from "./lib/runDisplay";
import type { PastRun, RunStatus, TimelineStep } from "./types";

function toPastRuns(runs: RunSummary[]): PastRun[] {
  return filterVisibleRuns(runs).map((run) => ({
    id: run.id,
    goal: run.goal,
  }));
}

function toRunStatus(run: RunSummary | null): RunStatus {
  if (!run) {
    return "idle";
  }
  if (run.status === "running") {
    return "running";
  }
  if (run.status === "completed") {
    return "succeeded";
  }
  if (
    run.status === "succeeded" ||
    run.status === "stuck" ||
    run.status === "step_cap" ||
    run.status === "cost_cap" ||
    run.status === "timeout" ||
    run.status === "error"
  ) {
    return run.status;
  }
  return "idle";
}

function App() {
  const [goal, setGoal] = useState("");
  const [pastRuns, setPastRuns] = useState<PastRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<RunSummary | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRuns()
      .then((runs) => setPastRuns(toPastRuns(runs)))
      .catch((err: Error) =>
        setError(err.message || "Failed to load past runs"),
      );
  }, []);

  async function refreshPastRuns() {
    const runs = await listRuns();
    setPastRuns(toPastRuns(runs));
  }

  async function loadRun(runId: string) {
    setIsLoadingRun(true);
    setError(null);
    try {
      const detail = await getRun(runId);
      setSelectedRunId(runId);
      setCurrentRun(detail.run);
      setTimelineSteps(stepsToTimeline(detail.steps));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load run details",
      );
    } finally {
      setIsLoadingRun(false);
    }
  }

  async function handleRun() {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { run_id } = await createRun(trimmedGoal);
      await loadRun(run_id);
      await refreshPastRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectRun(runId: string) {
    void loadRun(runId);
  }

  const bannerStatus: RunStatus = isSubmitting
    ? "running"
    : isLoadingRun
      ? "loading"
      : toRunStatus(currentRun);

  const showWorkspaceEmpty =
    selectedRunId === null && !isSubmitting && !isLoadingRun;

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar" aria-label="Past runs">
        <PastRunsList
          runs={pastRuns}
          selectedRunId={selectedRunId}
          onSelectRun={handleSelectRun}
        />
      </aside>

      <main className="app-shell__main">
        <header className="app-header">
          <h1 className="app-header__title">AgentKit</h1>
        </header>

        {error ? (
          <p className="app-error" role="alert">
            {error}
          </p>
        ) : null}

        <GoalForm
          goal={goal}
          onGoalChange={setGoal}
          onRun={handleRun}
          runDisabled={isSubmitting}
        />

        {showWorkspaceEmpty ? (
          <section className="workspace-empty" aria-labelledby="empty-heading">
            <h2 id="empty-heading" className="workspace-empty__heading">
              Get started
            </h2>
            <p className="workspace-empty__text">
              Enter a goal and click Run to start an agent run. Progress and
              results will show in the areas below.
            </p>
          </section>
        ) : null}

        {!showWorkspaceEmpty ? (
          <>
            <StatusBanner status={bannerStatus} />
            <RunTimeline steps={timelineSteps} />
            <FinalAnswer answer={getFinalAnswerDisplay(currentRun)} />
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;
