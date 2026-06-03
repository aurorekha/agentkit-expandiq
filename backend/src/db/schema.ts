import type Database from "better-sqlite3";

const RUNS_TABLE = `
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  goal TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  total_cost REAL DEFAULT 0,
  final_answer TEXT,
  started_at TEXT,
  finished_at TEXT
);
`;

const STEPS_TABLE = `
CREATE TABLE IF NOT EXISTS steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  tool_name TEXT,
  args_json TEXT,
  result_json TEXT,
  cost REAL DEFAULT 0,
  created_at TEXT
);
`;

export function applySchema(db: Database.Database): void {
  db.exec(RUNS_TABLE);
  db.exec(STEPS_TABLE);
}
