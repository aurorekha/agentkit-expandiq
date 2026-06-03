import type { TimelineStep } from "../types";

type RunTimelineProps = {
  steps: TimelineStep[];
};

export function RunTimeline({ steps }: RunTimelineProps) {
  return (
    <section className="run-timeline" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="run-timeline__heading">
        Steps
      </h2>
      {steps.length === 0 ? (
        <p className="run-timeline__empty">
          Steps will appear here when a run is active.
        </p>
      ) : (
        <ol className="run-timeline__list">
          {steps.map((step, index) => (
            <li key={step.id} className="run-timeline__item">
              <span className="run-timeline__index" aria-hidden="true">
                {index + 1}
              </span>
              <div className="run-timeline__content">
                <span className="run-timeline__title">{step.title}</span>
                {step.detail ? (
                  <span className="run-timeline__detail">{step.detail}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
