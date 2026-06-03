import type { PastRun } from "../types";

type PastRunsListProps = {
  runs: PastRun[];
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
};

export function PastRunsList({
  runs,
  selectedRunId,
  onSelectRun,
}: PastRunsListProps) {
  return (
    <nav className="past-runs" aria-labelledby="past-runs-heading">
      <h2 id="past-runs-heading" className="past-runs__heading">
        Past runs
      </h2>
      {runs.length === 0 ? (
        <p className="past-runs__empty">No runs yet.</p>
      ) : (
        <ul className="past-runs__list">
          {runs.map((run) => (
            <li key={run.id} className="past-runs__item">
              <button
                type="button"
                className="past-runs__button"
                aria-current={selectedRunId === run.id ? "true" : undefined}
                onClick={() => onSelectRun(run.id)}
              >
                <span className="past-runs__goal">{run.goal}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
