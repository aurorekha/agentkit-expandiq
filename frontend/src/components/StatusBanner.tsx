import type { RunStatus } from "../types";

type StatusBannerProps = {
  status: RunStatus;
};

const STATUS_LABELS: Record<RunStatus, string> = {
  idle: "No active run",
  loading: "Loading run…",
  running: "Run in progress",
  succeeded: "Succeeded",
  stuck: "Stuck",
  step_cap: "Step limit reached",
  cost_cap: "Cost limit reached",
  timeout: "Timed out",
  error: "Error",
};

export function StatusBanner({ status }: StatusBannerProps) {
  return (
    <section className="status-banner" aria-labelledby="status-heading">
      <h2 id="status-heading" className="visually-hidden">
        Run status
      </h2>
      <p className="status-banner__message" role="status" aria-live="polite">
        <span className={`status-banner__indicator status-banner__indicator--${status}`} />
        {STATUS_LABELS[status]}
      </p>
    </section>
  );
}
