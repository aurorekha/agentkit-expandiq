import type { FormEvent } from "react";

type GoalFormProps = {
  goal: string;
  onGoalChange: (value: string) => void;
  onRun: () => void;
  runDisabled?: boolean;
};

export function GoalForm({
  goal,
  onGoalChange,
  onRun,
  runDisabled = false,
}: GoalFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRun();
  }

  return (
    <form className="goal-form" onSubmit={handleSubmit} aria-labelledby="goal-heading">
      <h2 id="goal-heading" className="goal-form__heading">
        Goal
      </h2>
      <label className="goal-form__label" htmlFor="goal-input">
        What should the agent do?
      </label>
      <textarea
        id="goal-input"
        className="goal-form__input"
        name="goal"
        rows={4}
        value={goal}
        onChange={(event) => onGoalChange(event.target.value)}
        placeholder="Describe the task for the agent…"
        required
      />
      <button
        type="submit"
        className="goal-form__submit"
        disabled={runDisabled || goal.trim().length === 0}
      >
        Run
      </button>
    </form>
  );
}
