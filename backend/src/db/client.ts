import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applySchema } from "./schema.js";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(moduleDir, "../../data");
const dbPath = join(dataDir, "agentkit.db");

let db: Database.Database | null = null;

export type Run = {
  id: string;
  goal: string;
  status: string;
  reason: string | null;
  total_cost: number;
  final_answer: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type RunUpdates = {
  status?: string;
  reason?: string | null;
  total_cost?: number;
  final_answer?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

export type Step = {
  id: number;
  run_id: string;
  step_number: number;
  tool_name: string | null;
  args_json: string | null;
  result_json: string | null;
  cost: number;
  created_at: string | null;
};

export type CreateStepInput = {
  run_id: string;
  step_number: number;
  tool_name?: string | null;
  args_json?: string | null;
  result_json?: string | null;
  cost?: number;
  created_at?: string;
};

type RunRow = {
  id: string;
  goal: string;
  status: string;
  reason: string | null;
  total_cost: number;
  final_answer: string | null;
  started_at: string | null;
  finished_at: string | null;
};

type StepRow = {
  id: number;
  run_id: string;
  step_number: number;
  tool_name: string | null;
  args_json: string | null;
  result_json: string | null;
  cost: number;
  created_at: string | null;
};

function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() before using persistence.");
  }
  return db;
}

function mapRun(row: RunRow): Run {
  return {
    id: row.id,
    goal: row.goal,
    status: row.status,
    reason: row.reason,
    total_cost: row.total_cost,
    final_answer: row.final_answer,
    started_at: row.started_at,
    finished_at: row.finished_at,
  };
}

function mapStep(row: StepRow): Step {
  return {
    id: row.id,
    run_id: row.run_id,
    step_number: row.step_number,
    tool_name: row.tool_name,
    args_json: row.args_json,
    result_json: row.result_json,
    cost: row.cost,
    created_at: row.created_at,
  };
}

export function initDb(): void {
  mkdirSync(dataDir, { recursive: true });
  if (db) {
    return;
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  applySchema(db);
}

/** In-memory (default) or file-backed DB for tests. Does not use agentkit.db. */
export function initTestDb(databasePath = ":memory:"): void {
  closeDb();
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  applySchema(db);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function createRun(goal: string): Run {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const status = "running";

  database
    .prepare(
      `INSERT INTO runs (id, goal, status, started_at)
       VALUES (@id, @goal, @status, @started_at)`,
    )
    .run({ id, goal, status, started_at: startedAt });

  const row = database
    .prepare(
      `SELECT id, goal, status, reason, total_cost, final_answer, started_at, finished_at
       FROM runs WHERE id = @id`,
    )
    .get({ id }) as RunRow | undefined;

  if (!row) {
    throw new Error(`Failed to create run ${id}`);
  }

  return mapRun(row);
}

export function updateRun(runId: string, updates: RunUpdates): Run | null {
  const database = getDatabase();
  const fields: string[] = [];
  const params: Record<string, string | number | null> = { id: runId };

  if (updates.status !== undefined) {
    fields.push("status = @status");
    params.status = updates.status;
  }
  if (updates.reason !== undefined) {
    fields.push("reason = @reason");
    params.reason = updates.reason;
  }
  if (updates.total_cost !== undefined) {
    fields.push("total_cost = @total_cost");
    params.total_cost = updates.total_cost;
  }
  if (updates.final_answer !== undefined) {
    fields.push("final_answer = @final_answer");
    params.final_answer = updates.final_answer;
  }
  if (updates.started_at !== undefined) {
    fields.push("started_at = @started_at");
    params.started_at = updates.started_at;
  }
  if (updates.finished_at !== undefined) {
    fields.push("finished_at = @finished_at");
    params.finished_at = updates.finished_at;
  }

  if (fields.length === 0) {
    return getRun(runId);
  }

  const result = database
    .prepare(`UPDATE runs SET ${fields.join(", ")} WHERE id = @id`)
    .run(params);

  if (result.changes === 0) {
    return null;
  }

  return getRun(runId);
}

export function getRun(runId: string): Run | null {
  const database = getDatabase();
  const row = database
    .prepare(
      `SELECT id, goal, status, reason, total_cost, final_answer, started_at, finished_at
       FROM runs WHERE id = @id`,
    )
    .get({ id: runId }) as RunRow | undefined;

  return row ? mapRun(row) : null;
}

export function listRuns(): Run[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `SELECT id, goal, status, reason, total_cost, final_answer, started_at, finished_at
       FROM runs
       ORDER BY started_at DESC, id DESC`,
    )
    .all() as RunRow[];

  return rows.map(mapRun);
}

export function createStep(input: CreateStepInput): Step {
  const database = getDatabase();
  const createdAt = input.created_at ?? new Date().toISOString();
  const cost = input.cost ?? 0;

  const result = database
    .prepare(
      `INSERT INTO steps (run_id, step_number, tool_name, args_json, result_json, cost, created_at)
       VALUES (@run_id, @step_number, @tool_name, @args_json, @result_json, @cost, @created_at)`,
    )
    .run({
      run_id: input.run_id,
      step_number: input.step_number,
      tool_name: input.tool_name ?? null,
      args_json: input.args_json ?? null,
      result_json: input.result_json ?? null,
      cost,
      created_at: createdAt,
    });

  const row = database
    .prepare(
      `SELECT id, run_id, step_number, tool_name, args_json, result_json, cost, created_at
       FROM steps WHERE id = @id`,
    )
    .get({ id: result.lastInsertRowid }) as StepRow | undefined;

  if (!row) {
    throw new Error(`Failed to create step for run ${input.run_id}`);
  }

  return mapStep(row);
}

export function getSteps(runId: string): Step[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `SELECT id, run_id, step_number, tool_name, args_json, result_json, cost, created_at
       FROM steps
       WHERE run_id = @run_id
       ORDER BY step_number ASC, id ASC`,
    )
    .all({ run_id: runId }) as StepRow[];

  return rows.map(mapStep);
}
