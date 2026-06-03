type FinalAnswerProps = {
  answer: string | null;
};

export function FinalAnswer({ answer }: FinalAnswerProps) {
  return (
    <section className="final-answer" aria-labelledby="answer-heading">
      <h2 id="answer-heading" className="final-answer__heading">
        Final answer
      </h2>
      {answer === null || answer.length === 0 ? (
        <p className="final-answer__empty">
          The agent&apos;s final answer will appear here when the run completes.
        </p>
      ) : (
        <div className="final-answer__body">{answer}</div>
      )}
    </section>
  );
}
