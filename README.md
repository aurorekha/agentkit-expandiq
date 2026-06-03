# AgentKit

AgentKit is a small full-stack agent runtime built for a time-boxed assignment. It accepts a natural-language goal, retrieves relevant tools, plans actions with a deterministic mock LLM, executes tools, persists run history in SQLite, and returns a final answer or a terminal reason when a safety guard stops the run.

This project is a learning and demonstration scaffold—not a production agent platform.

## What It Does

- **Goal submission** — Users submit a goal from the web UI or `POST /runs`. Each goal starts a new run.
- **Tool retrieval** — The runtime scores tools by keyword overlap against the goal and selects the top candidates (default 5).
- **Deterministic mock LLM** — A rule-based planner chooses the next tool call or a final answer from the goal text and prior steps. Behaviour is repeatable and test-friendly.
- **Tool execution** — Registered tools return canned, deterministic results (no external APIs or network calls).
- **Persistence** — Runs and every tool step are stored in SQLite (`backend/data/agentkit.db` at dev time).
- **Safety guards** — Step cap, cost cap, stuck detection, timeout, and retry rules can end a run early with a clear reason.
- **Run history** — Past runs appear in the sidebar; selecting a run loads its steps, status, and final outcome.

## Architecture

### Frontend

- React
- Vite
- TypeScript
- Plain CSS (no component library)

Served at **http://localhost:4000**. API requests are proxied to the backend via Vite (`/runs` → port 5173).

### Backend

- Fastify
- SQLite (`better-sqlite3`)
- Vitest

Runs at **http://localhost:5173**.

### Agent flow

```text
Goal
  → Tool Retrieval
  → Mock LLM
  → Tool Execution
  → Persistence
  → Final Answer
```

On each loop iteration the runtime loads existing steps, retrieves tools, asks the mock LLM for the next action, executes a tool (or finishes), persists the step, and checks guards before continuing.

## Safety Guards

| Guard | Default / limit | Terminal status |
|--------|------------------|-----------------|
| **Step cap** | `max_steps` = 20 | `step_cap` |
| **Cost cap** | `max_cost_usd` = 0.50 | `cost_cap` |
| **Stuck detection** | Same `tool_name` + `args_json` three times in a row | `stuck` |
| **Timeout** | 60 seconds per run | `timeout` |
| **Retry handling** | One retry when `error.recoverable === true`; otherwise stop | `error` |

Recoverable errors (e.g. Melbourne weather temporarily unavailable) are retried once inside the same iteration. Non-recoverable errors (e.g. `send_email` without a recipient) stop the run immediately.

## API

Base URL: **http://localhost:5173**

### `POST /runs`

Creates a run, executes the agent synchronously, and returns the run id.

**Request**

```json
{
  "goal": "read the policy docs",
  "max_steps": 20,
  "max_cost_usd": 0.5
}
```

`max_steps` and `max_cost_usd` are optional (defaults: 20 and 0.5).

**Response** `200`

```json
{
  "run_id": "8f2e23fe-070b-4aa1-9572-4513cb98b88e"
}
```

**Error** `400` (invalid body)

```json
{
  "error": "goal must be a non-empty string"
}
```

### `GET /runs`

Returns recent runs, newest first.

**Response** `200`

```json
[
  {
    "id": "8f2e23fe-070b-4aa1-9572-4513cb98b88e",
    "goal": "read the policy docs",
    "status": "succeeded",
    "reason": null,
    "total_cost": 0.007,
    "final_answer": "Documentation review complete: searched docs, fetched an article, and produced a summary.",
    "started_at": "2026-06-03T12:00:00.000Z",
    "finished_at": "2026-06-03T12:00:01.000Z"
  }
]
```

### `GET /runs/:run_id`

Returns one run and its steps.

**Response** `200`

```json
{
  "run": {
    "id": "8f2e23fe-070b-4aa1-9572-4513cb98b88e",
    "goal": "read the policy docs",
    "status": "succeeded",
    "reason": null,
    "total_cost": 0.007,
    "final_answer": "Documentation review complete: searched docs, fetched an article, and produced a summary.",
    "started_at": "2026-06-03T12:00:00.000Z",
    "finished_at": "2026-06-03T12:00:01.000Z"
  },
  "steps": [
    {
      "id": 1,
      "run_id": "8f2e23fe-070b-4aa1-9572-4513cb98b88e",
      "step_number": 1,
      "tool_name": "search_docs",
      "args_json": "{\"query\":\"policy\"}",
      "result_json": "{\"ok\":true,\"data\":{...},\"error\":null}",
      "cost": 0.002,
      "created_at": "2026-06-03T12:00:00.100Z"
    }
  ]
}
```

**Error** `404`

```json
{
  "error": "run not found"
}
```

CORS is enabled for **http://localhost:4000**.

## Running Locally

```bash
npm install
```

Start the API and UI in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev:ui
```

- UI: http://localhost:4000
- API: http://localhost:5173
- Health check: http://localhost:5173/health

Run backend tests:

```bash
npm test -w backend
```

## Tests

Backend tests use Vitest with an in-memory SQLite database (not the local `agentkit.db` file).

| Area | What is covered |
|------|------------------|
| **Retrieval ranking** | `"weather"` includes `fetch_weather` in top 5; `"policy docs"` includes `search_docs`, `fetch_doc`, `summarise_text` |
| **Stuck detection** | Goal `"stuck"` ends with status/reason `stuck` |
| **Step cap** | Goal `"stuck"` with `maxSteps: 2` ends with `step_cap` |
| **Cost cap** | Goal `"policy docs"` with a very low `maxCostUsd` ends with `cost_cap` |
| **Retry behaviour** | Recoverable Melbourne weather retries once; non-recoverable `send_email` does not retry |
| **Integration** | Full `"policy docs"` run succeeds with persisted steps and `final_answer` |

Test files live under `backend/test/`.

## Design Decisions

### Why SQLite?

SQLite keeps local persistence simple: one file, no separate database server, and straightforward helpers with `better-sqlite3`. It fits an assignment-focused, run-on-your-machine workflow.

### Why deterministic mock LLM?

A rule-based mock LLM makes runs predictable, easy to debug, and safe to test without API keys or flaky external services. Scenario selection is driven by goal keywords and `pastSteps.length`.

### Why keyword retrieval?

Keyword overlap scoring is easy to explain and implement within a time box. It avoids embeddings, vector stores, and extra infrastructure while still narrowing the tool set per goal.

### Why persist every step?

Each tool call is stored with arguments and results so runs are auditable, easier to debug, and suitable for replay or UI timelines without re-executing tools.

## Known Limitations

- **Synchronous execution** — `POST /runs` blocks until the agent finishes; there is no job queue.
- **Deterministic mock LLM** — Not a real language model; planning is scripted by keyword scenarios.
- **Keyword retrieval** — No semantic search or embeddings; ranking depends on tool keywords and descriptions.
- **Canned tools** — No live web, email, weather, or database integrations.
- **No streaming** — The UI loads the full run after completion.
- **No authentication** — API and UI are open on localhost for development.

## Future Improvements

- Async job execution and a poll or webhook model for long runs
- Streaming step updates to the UI
- Richer planning (real LLM with structured tool calls)
- Vector or hybrid retrieval
- Authentication and per-user run isolation
- Tool argument validation and schema enforcement at the API boundary

## AI Assist Log

AI coding tools were used during development for:

- Project scaffolding
- Code generation (frontend, backend, runtime, tools, API)
- Test generation
- Documentation drafting

All generated output was reviewed, edited, integrated, and validated manually (including running the app and `npm test -w backend`).

## Prompt History

Prompt history and AI-assisted development conversations are included with the submission, as requested. The exported conversation logs show the planning, implementation, testing, and refinement process used to build AgentKit.

## License

Private — assignment project.
