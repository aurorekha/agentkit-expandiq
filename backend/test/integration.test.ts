import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRun, getRun, getSteps } from "../src/db/client.js";
import { runAgent } from "../src/runtime/loop.js";
import { setupTestDb, teardownTestDb } from "./helpers.js";

describe("agent integration", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  it('completes a "policy docs" run with persisted steps and final answer', () => {
    const run = createRun("policy docs");
    const finished = runAgent({ runId: run.id, goal: "policy docs" });
    const steps = getSteps(run.id);
    const persisted = getRun(run.id);

    expect(finished.status).toBe("succeeded");
    expect(finished.reason).toBeNull();
    expect(finished.final_answer).toBeTruthy();
    expect(steps.length).toBeGreaterThan(0);
    expect(persisted?.final_answer).toBe(finished.final_answer);
    expect(steps.every((step) => step.tool_name && step.result_json)).toBe(true);
  });
});
