import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRun, getRun, getSteps } from "../src/db/client.js";
import { runAgent } from "../src/runtime/loop.js";
import { setupTestDb, teardownTestDb } from "./helpers.js";

describe("runtime guards", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  it('ends goal "stuck" with status and reason "stuck"', () => {
    const run = createRun("stuck");
    const finished = runAgent({ runId: run.id, goal: "stuck" });

    expect(finished.status).toBe("stuck");
    expect(finished.reason).toBe("stuck");
    expect(getSteps(run.id).length).toBeGreaterThanOrEqual(3);
  });

  it('ends goal "stuck" with reason "step_cap" when maxSteps is 2', () => {
    const run = createRun("stuck");
    const finished = runAgent({ runId: run.id, goal: "stuck", maxSteps: 2 });

    expect(finished.status).toBe("step_cap");
    expect(finished.reason).toBe("step_cap");
    expect(getSteps(run.id)).toHaveLength(2);
  });

  it('ends goal "policy docs" with reason "cost_cap" when maxCostUsd is very low', () => {
    const run = createRun("policy docs");
    const finished = runAgent({
      runId: run.id,
      goal: "policy docs",
      maxCostUsd: 0.003,
    });

    expect(finished.status).toBe("cost_cap");
    expect(finished.reason).toBe("cost_cap");
  });
});
