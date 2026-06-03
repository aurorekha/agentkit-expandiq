import { useState } from "react";
import { FinalAnswer } from "./components/FinalAnswer";
import { GoalForm } from "./components/GoalForm";
import { PastRunsList } from "./components/PastRunsList";
import { RunTimeline } from "./components/RunTimeline";
import { StatusBanner } from "./components/StatusBanner";
import type { PastRun, RunStatus, TimelineStep } from "./types";

const EMPTY_RUNS: PastRun[] = [];
const EMPTY_STEPS: TimelineStep[] = [];

function App() {
  const [goal, setGoal] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Widened for future API-driven status updates.
  const runStatus = "idle" as RunStatus;
  const showWorkspaceEmpty =
    selectedRunId === null && runStatus === "idle";

  function handleRun() {
    // API wiring will be added in a later slice.
  }

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar" aria-label="Past runs">
        <PastRunsList
          runs={EMPTY_RUNS}
          selectedRunId={selectedRunId}
          onSelectRun={setSelectedRunId}
        />
      </aside>

      <main className="app-shell__main">
        <header className="app-header">
          <h1 className="app-header__title">AgentKit</h1>
        </header>

        <GoalForm
          goal={goal}
          onGoalChange={setGoal}
          onRun={handleRun}
          runDisabled={runStatus === "running"}
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

        <StatusBanner status={runStatus} />
        <RunTimeline steps={EMPTY_STEPS} />
        <FinalAnswer answer={null} />
      </main>
    </div>
  );
}

export default App;
