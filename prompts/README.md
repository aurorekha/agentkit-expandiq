# Prompt History
## AI Assist Log

AI assistance was used throughout development for:

- project scaffolding
- implementation planning
- code generation
- test generation
- documentation drafting

All generated code was reviewed, modified, integrated, and validated manually.

The complete AI conversation history used during development is included with the submission as requested.

# AgentKit frontend shell implementation
_Exported on 6/3/2026 at 22:46:46 GMT+10 from Cursor (3.5.33)_

---

**User**

Next implementation slice: 
Goal:
Create the minimal frontend shell for AgentKit.

Use:
- React
- Vite
- TypeScript
- plain CSS

Assume UI will run on http://localhost:4000
API runs on http://localhost:5173

Build one screen with:
- app title: AgentKit
- goal input
- run button
- empty state
- past runs sidebar
- run status area
- step timeline area
- final answer area

Do not wire real API logic yet.
Do not create backend runtime.
Do not create mock data that becomes hard to remove.
Do not add routing.
Do not add component libraries.
Do not add state libraries.

Create simple components:
- GoalForm
- PastRunsList
- RunTimeline
- FinalAnswer
- StatusBanner

Keep the UI clean, accessible, and easy to understand.
Use semantic HTML.
Preserve keyboard focus styles.

---

**Cursor**

Exploring the project structure to see what's already in place for the frontend shell.


Building the component shell and layout. Vite is already configured for port 4000 with API proxy to 5173.


The minimal AgentKit UI shell is in place on top of the existing Vite + React setup.

## Layout

Single-screen app with:
- **Header** — “AgentKit”
- **Sidebar** — `PastRunsList` (empty: “No runs yet”)
- **Main** — `GoalForm`, workspace empty state, `StatusBanner`, `RunTimeline`, `FinalAnswer`

## Components (`frontend/src/components/`)

| Component | Role |
|-----------|------|
| `GoalForm` | Labeled goal textarea + Run button (disabled when goal is empty) |
| `PastRunsList` | Semantic `<nav>` with selectable run buttons when data exists |
| `StatusBanner` | `role="status"` + `aria-live="polite"` |
| `RunTimeline` | Ordered step list or placeholder copy |
| `FinalAnswer` | Answer block or placeholder copy |

## Intentionally not included

- No API calls (`handleRun` is a stub)
- No mock runs/steps/answers — empty arrays and `null` from `App`
- No routing, UI libs, or state libs (only local `goal` / `selectedRunId`)

## Config

`frontend/vite.config.ts` already serves the UI on **port 4000** and proxies `/runs` and `/health` to **http://localhost:5173**.

## Run locally

```bash
npm run dev:ui    # http://localhost:4000
npm run dev:api   # http://localhost:5173 (when you need the API)
```

Shared types live in `frontend/src/types.ts` (`RunStatus`, `PastRun`, `TimelineStep`) for the next slice when you wire `POST /runs` and polling. Styling is plain CSS in `index.css` with `:focus-visible` outlines and a responsive sidebar stack on narrow viewports.

---

**User**

Implement the next commit only.

Goal:
Add SQLite persistence for AgentKit runs and steps.

Use:
- better-sqlite3
- plain functions only
- no ORM
- no classes
- no repository pattern
- no dependency injection

Backend runs on http://localhost:5173.

Create:

backend/src/db/client.ts
backend/src/db/schema.ts

Schema:

runs
- id TEXT PRIMARY KEY
- goal TEXT NOT NULL
- status TEXT NOT NULL
- reason TEXT
- total_cost REAL DEFAULT 0
- final_answer TEXT
- started_at TEXT
- finished_at TEXT

steps
- id INTEGER PRIMARY KEY AUTOINCREMENT
- run_id TEXT NOT NULL
- step_number INTEGER NOT NULL
- tool_name TEXT
- args_json TEXT
- result_json TEXT
- cost REAL DEFAULT 0
- created_at TEXT

Requirements:
- initialize database automatically when backend starts
- create backend/data/agentkit.db
- create tables if they do not exist
- export simple typed helper functions:
  - createRun(goal)
  - updateRun(runId, updates)
  - getRun(runId)
  - listRuns()
  - createStep(step)
  - getSteps(runId)

Do not implement:
- tools
- mock LLM
- runtime loop
- safety guards
- API routes

Only persistence.

---

**Cursor**

Exploring the backend structure and adding SQLite persistence.


SQLite persistence for runs and steps is in place.

## Added

**`backend/src/db/schema.ts`** — `applySchema()` creates `runs` and `steps` with `CREATE TABLE IF NOT EXISTS`.

**`backend/src/db/client.ts`** — Plain helpers on a module-level `better-sqlite3` connection:
- DB file: `backend/data/agentkit.db` (directory created on init)
- WAL journal mode
- `initDb()`, `createRun`, `updateRun`, `getRun`, `listRuns`, `createStep`, `getSteps`
- Exported types: `Run`, `RunUpdates`, `Step`, `CreateStepInput`

**`backend/src/index.ts`** — Calls `initDb()` before the server listens.

**Dependency:** `better-sqlite3` (+ `@types/better-sqlite3`) in the backend workspace.

## Behavior

- `createRun(goal)` — UUID id, `status: "pending"`, `started_at` ISO timestamp
- `updateRun` — Partial updates; returns `null` if the run id is missing
- `listRuns` — Newest `started_at` first
- `getSteps` — Ordered by `step_number`, then `id`
- `createStep` — Defaults `created_at` and `cost` when omitted

No API routes, runtime, or tools were added. `backend/data/` stays gitignored; the DB is created on first `npm run dev:api` / `start`.

---

**User**

Update the SQLite persistence layer so newly created runs start with:

status: "running"

instead of:

status: "pending"

Reason:
The assignment runtime executes immediately after run creation, so "running" better reflects the lifecycle.

Requirements:
- Update createRun()
- Update any related TypeScript types/unions if needed
- Do not change any other behavior
- Do not add new features
- Do not modify API routes
- Do not modify runtime code

Return a summary of the files

---

**Cursor**

## Summary

**Changed**

| File | Change |
|------|--------|
| `backend/src/db/client.ts` | In `createRun()`, initial `status` is now `"running"` instead of `"pending"`. |

**Unchanged**

- No backend `RunStatus` union exists (`Run.status` stays `string`), so no type updates were required.
- Schema, other helpers, API routes, runtime, and frontend were not modified.

New runs created via `createRun()` are stored with `status: "running"` from insert time.

---

**User**

Implementation goal: 
Create the AgentKit tool registry.

Requirements:

Create:

backend/src/tools/registry.ts

Define these tools:

- search_docs
- fetch_doc
- send_email
- create_calendar_event
- query_sql
- summarise_text
- translate
- fetch_weather
- lookup_contact
- web_search

Each tool must have:

{
  name: string
  description: string
  keywords: string[]
  idempotent: boolean
  parallelSafe: boolean
  execute: (args) => ToolResult
}

Create shared ToolResult type:

type ToolResult = {
  ok: boolean
  data: unknown | null
  error: {
    code: string
    message: string
    recoverable: boolean
  } | null
}

Requirements:

- deterministic responses only
- no external APIs
- no network calls
- canned data only
- all tools live in registry.ts
- no separate files per tool
- export:
  - toolRegistry
  - getTool(name)

Special cases:

1. fetch_weather
- first call for city "Melbourne"
  returns:
  {
    ok: false,
    error: {
      code: "TEMP_UNAVAILABLE",
      message: "Weather service temporarily unavailable",
      recoverable: true
    }
  }
- subsequent calls succeed

2. send_email
- missing recipient
  returns:
  {
    ok: false,
    error: {
      code: "INVALID_ARGUMENT",
      message: "recipient is required",
      recoverable: false
    }
  }

Do not implement:
- retrieval
- runtime loop
- mock llm
- guards
- API routes

Focus only on tool definitions and tool contracts.

Keep the code simple and easy to explain

---

**Cursor**

Creating the tool registry with deterministic canned responses and the specified special cases.


Created `backend/src/tools/registry.ts` with the tool registry.

## File: `backend/src/tools/registry.ts`

**Exports**
- `ToolResult` — shared result shape (`ok`, `data`, `error`)
- `Tool` — tool contract (`name`, `description`, `keywords`, `idempotent`, `parallelSafe`, `execute`)
- `toolRegistry` — array of all 10 tools
- `getTool(name)` — lookup by name

**Tools** (all in one file, deterministic canned `data`, no network)

| Tool | Idempotent | Parallel safe |
|------|------------|---------------|
| `search_docs` | yes | yes |
| `fetch_doc` | yes | yes |
| `send_email` | no | no |
| `create_calendar_event` | no | no |
| `query_sql` | yes | yes |
| `summarise_text` | yes | yes |
| `translate` | yes | yes |
| `fetch_weather` | no | yes |
| `lookup_contact` | yes | yes |
| `web_search` | yes | yes |

**Special behavior**
- **`send_email`** — missing/blank `recipient` → `INVALID_ARGUMENT`, not recoverable
- **`fetch_weather`** — first call for `"Melbourne"` → `TEMP_UNAVAILABLE`, recoverable; later calls return canned Melbourne weather

Nothing else was changed (no routes, runtime, guards, or retrieval). Backend build passes.

---

**User**


Next Goal:
Add keyword-based tool retrieval and deterministic mock LLM.

Do not implement the runtime loop yet.
Do not execute tools yet.
Do not add API routes yet.
Do not modify the frontend.

Create:

backend/src/runtime/retrieval.ts
backend/src/runtime/mock-llm.ts

1. Tool retrieval

Implement:

retrieveTools(goal: string, topK = 5)

Requirements:
- use the toolRegistry from backend/src/tools/registry.ts
- score tools by simple keyword overlap using:
  - goal text
  - tool keywords
  - tool name
  - tool description
- return the top K tools
- deterministic ordering
- no embeddings
- no external libraries

2. Mock LLM

Implement deterministic mock LLM.

Input:

{
  goal: string
  pastSteps: Array<{
    tool_name: string | null
    args_json: string | null
    result_json: string | null
  }>
  candidateTools: Tool[]
}

Output must be one of:

{
  type: "tool_call"
  tool: string
  args: Record<string, unknown>
  cost: number
}

or

{
  type: "final"
  content: string
  cost: number
}

Requirements:
- deterministic only
- no randomness
- no real LLM
- use goal keywords and pastSteps.length to decide what to do
- only call tools that exist in candidateTools
- support these scenarios:

A. Goal includes "docs" or "policy":
   Step 0: call search_docs
   Step 1: call fetch_doc
   Step 2: call summarise_text
   Step 3: final answer

B. Goal includes "weather":
   Step 0: call fetch_weather with city "Melbourne"
   Step 1: final answer

C. Goal includes "stuck":
   Always call search_docs with the same args so the runtime can later detect stuck

D. Goal includes "email":
   Step 0: call lookup_contact
   Step 1: call send_email
   Step 2: final answer

E. Default:
   Step 0: call web_search
   Step 1: final answer

Keep costs simple:
- tool_call cost: 0.002
- final cost: 0.001

Also export useful TypeScript types for MockLlmInput and MockLlmOutput.

Keep code simple and easy to test.

---

**Cursor**

Implementing retrieval and mock LLM modules per the specified scenarios.


Added keyword-based retrieval and a deterministic mock LLM.

## `backend/src/runtime/retrieval.ts`

- **`retrieveTools(goal, topK = 5)`** — scores every tool in `toolRegistry` by overlap between goal tokens/text and:
  - tool name (and underscore-split tokens)
  - keywords (substring + token match)
  - description tokens
- Sorts by score descending, then `name` ascending (stable, deterministic)
- Returns top K tools

## `backend/src/runtime/mock-llm.ts`

**Types:** `PastStep`, `MockLlmInput`, `MockLlmToolCall`, `MockLlmFinal`, `MockLlmOutput`

**`mockLlm(input)`** — uses `pastSteps.length` as the step index and picks a scenario from the goal:

| Scenario | Trigger | Steps |
|----------|---------|--------|
| **C** | `"stuck"` | Always `search_docs` with `{ query: "stuck" }` (never advances to final) |
| **A** | `"docs"` or `"policy"` | `search_docs` → `fetch_doc` → `summarise_text` → final |
| **B** | `"weather"` | `fetch_weather` (`Melbourne`) → final |
| **D** | `"email"` | `lookup_contact` → `send_email` → final |
| **E** | default | `web_search` → final |

- Only emits tools present in `candidateTools`; skips missing tools and moves on
- Costs: `0.002` per tool call, `0.001` for final
- Scenario priority: stuck → docs/policy → weather → email → default

No runtime loop, tool execution, API routes, or frontend changes. Backend build passes.

---

**User**

The only thing left to verify is whether search_docs expects:

{ query: "..." }

or:

{ q: "..." }

---

**Cursor**

`search_docs` expects **`{ query: "..." }`**, not `q`.

In the registry handler it reads `args.query` and falls back to `"general"` if missing:

```49:49:backend/src/tools/registry.ts
    const query = asString(args.query, "general");
```

`mock-llm.ts` already matches that — docs/policy uses `{ query: docsQuery(goal) }`, and the stuck path uses `{ query: "stuck" }` via `STUCK_SEARCH_ARGS`. No change needed for the argument shape.

---

**User**

Next Goal:
Create the AgentKit runtime loop.

Use existing:
- SQLite persistence helpers
- tool registry
- retrieveTools()
- mockLlm()

Create:

backend/src/runtime/loop.ts

Requirements:

Implement:

runAgent({
  runId,
  goal,
  maxSteps = 20,
  maxCostUsd = 0.5
})

Loop:

1. Load current steps
2. Retrieve top 5 tools
3. Call mockLlm()
4. If tool_call:
   - execute tool
   - persist step
   - continue
5. If final:
   - update run
   - mark succeeded
   - stop

Safety guards:

1. Step cap
- terminate with:
  reason: "step_cap"

2. Cost cap
- accumulate costs from LLM responses and tool executions
- terminate with:
  reason: "cost_cap"

3. Stuck detector
- detect same:
  tool_name + args_json
  repeated 3 times consecutively
- terminate with:
  reason: "stuck"

4. Timeout guard
- 60 second limit
- terminate with:
  reason: "timeout"

Tool error handling:

Use ToolResult contract.

If:
error.recoverable === true

retry once.

If retry succeeds:
continue.

If retry fails:
terminate with:
reason: "error"

If:
recoverable === false

terminate immediately.

Persist every step.

Persist:
- tool name
- args
- result
- cost

Update run status to one of:

running
succeeded
step_cap
cost_cap
stuck
timeout
error

Keep implementation simple.

Do not create:
- services
- repositories
- abstractions
- state machines

One runtime file is preferred.

---

**Cursor**

Reviewing existing modules to implement the runtime loop.


Implementing the runtime loop with guards, tool execution, and persistence.


Added `backend/src/runtime/loop.ts` with the agent runtime loop.

## `runAgent(input)`

**Input:** `runId`, `goal`, `maxSteps` (default 20), `maxCostUsd` (default 0.5)

**Each iteration:**
1. Load steps from SQLite
2. Guards: **timeout** (60s), **step_cap**, **cost_cap**, **stuck** (3 consecutive identical `tool_name` + `args_json`)
3. `retrieveTools(goal, 5)` → `mockLlm()` → add LLM `cost` to `totalCost`
4. **cost_cap** check again after LLM cost
5. **`final`** → `status: "succeeded"`, set `final_answer`, stop
6. **`tool_call`** → `getTool` + execute with **one retry** if `error.recoverable`
7. Persist step (`tool_name`, `args_json`, `result_json`, `cost` = LLM step cost)
8. On tool failure after retry (or non-recoverable): persist failing step, `status: "error"`, stop
9. `updateRun` with `running` + `total_cost`, loop

**Terminal statuses:** `succeeded`, `step_cap`, `cost_cap`, `stuck`, `timeout`, `error` (with matching `reason`, except `succeeded` → `reason: null`)

**Notes:**
- Recoverable errors (e.g. Melbourne weather) retry once inside the same iteration; one persisted step on success
- Stuck detection runs on the next iteration after the 3rd duplicate step is saved
- For goals like `"I am stuck"`, `search_docs` may fall outside the top 5 retrieved tools, so the mock LLM can return `final` immediately — use a goal that retrieves `search_docs` (e.g. includes `"stuck"` plus doc-related terms) to exercise the stuck path

No API routes, services, or frontend changes. Build passes.

---

**User**

Small runtime/retrieval alignment fix only.

Problem:
The mock LLM has a "stuck" scenario that calls search_docs repeatedly, but retrieval may not include search_docs in the top 5 for a goal like "stuck". That makes the stuck detector unreliable to exercise.

Fix:
Make the stuck path deterministic.

Preferred solution:
Update retrieval/tool keywords so the goal "stuck" retrieves search_docs in the top 5.

Options:
- add "stuck" to search_docs keywords
- or ensure retrieveTools gives search_docs enough score for stuck goals

Do not change runtime behavior.
Do not add routes, frontend, tests, or new abstractions.

After the change, a goal of exactly:
"stuck"
should lead mockLlm to call search_docs repeatedly so the runtime can terminate with reason "stuck".

Return the exact file changed and summary.

---

**Cursor**

## File changed

`backend/src/tools/registry.ts`

## Change

Added `"stuck"` to the `search_docs` `keywords` array so goals containing `"stuck"` score that tool highly in `retrieveTools()`.

## Result

For goal `"stuck"`:
- `search_docs` is in the top 5 (ranked first)
- `mockLlm` keeps issuing `search_docs` with `{ query: "stuck" }`
- After 3 identical consecutive steps, the runtime ends with `status` / `reason` `"stuck"`

No runtime, routes, frontend, or test changes.

---

**User**

Next Goal:
Expose the AgentKit runs API.

Use existing:
- createRun()
- listRuns()
- getRun()
- getSteps()
- runAgent()

Create or update:

backend/src/api/runs.routes.ts
backend/src/index.ts

API requirements:

1. POST /runs

Request body:
{
  goal: string,
  max_steps?: number,
  max_cost_usd?: number
}

Behavior:
- validate goal is a non-empty string
- default max_steps to 20
- default max_cost_usd to 0.5
- create run
- execute runAgent({ runId, goal, maxSteps, maxCostUsd })
- return:
{
  run_id: string
}

2. GET /runs

Behavior:
- return recent runs newest first
- include:
  - id
  - goal
  - status
  - reason
  - total_cost
  - final_answer
  - started_at
  - finished_at

3. GET /runs/:run_id

Behavior:
- return run state and steps
- if not found, return 404

Response:
{
  run: {...},
  steps: [...]
}

Also ensure:
- CORS allows frontend at http://localhost:4000
- backend still runs on http://localhost:5173
- keep code simple
- no services
- no controller classes
- no auth
- no frontend changes in this commit

Do not implement:
- tests
- frontend API wiring
- streaming
- resume endpoint

---

**Cursor**

Implementing runs API routes and registering them in the Fastify app with CORS.


Runs API is exposed on the backend.

## Files changed

| File | Change |
|------|--------|
| `backend/src/api/runs.routes.ts` | **Created** — `POST /runs`, `GET /runs`, `GET /runs/:run_id` |
| `backend/src/index.ts` | **Updated** — CORS for `http://localhost:4000`, registers run routes |
| `backend/package.json` | **Updated** — `@fastify/cors` dependency (via npm install) |

## Endpoints

**`POST /runs`** — Validates non-empty `goal`; defaults `max_steps` → 20, `max_cost_usd` → 0.5; `createRun` + synchronous `runAgent`; returns `{ run_id }`. Invalid body → 400.

**`GET /runs`** — Recent runs (newest first) with `id`, `goal`, `status`, `reason`, `total_cost`, `final_answer`, `started_at`, `finished_at`.

**`GET /runs/:run_id`** — `{ run, steps }` or 404.

## Other

- CORS allows origin `http://localhost:4000`
- Server still listens on port **5173**
- `/health` unchanged
- No auth, controllers, services, tests, or frontend changes

Start with `npm run dev:api` from the repo root.

---

**User**

Next Goal:
Wire the existing frontend UI to the backend runs API.

Current ports:
- frontend: http://localhost:4000
- backend: http://localhost:5173

Use existing frontend components:
- GoalForm
- PastRunsList
- RunTimeline
- FinalAnswer
- StatusBanner

Requirements:

1. Create frontend API client functions:
- createRun(goal)
- listRuns()
- getRun(runId)

2. On app load:
- fetch past runs
- show newest first in sidebar

3. On Run button:
- POST /runs with { goal }
- receive { run_id }
- fetch GET /runs/:run_id
- display selected run

4. Clicking a past run:
- fetch GET /runs/:run_id
- display its steps and final answer

5. Render timeline in friendly language:
Examples:
- search_docs → "Searched documents"
- fetch_doc → "Fetched document"
- summarise_text → "Summarised text"
- fetch_weather → "Checked weather"
- lookup_contact → "Looked up contact"
- send_email → "Prepared email"
- web_search → "Searched the web"

6. Render terminal reasons in human language:
- succeeded → final answer
- stuck → "The agent stopped because it repeated the same action too many times."
- step_cap → "The agent reached the maximum number of steps."
- cost_cap → "The agent reached the budget limit for this run."
- timeout → "The run timed out."
- error → "The run stopped because a tool returned an unrecoverable error."

7. Loading and error states:
- disable Run button while submitting
- show a clear error if backend call fails
- no infinite spinners

Do not add:
- routing
- state libraries
- component libraries
- streaming
- advanced styling
- backend changes

Keep changes simple and readable.

---

**Cursor**

Creating the API client and wiring App state to the backend.


The frontend is wired to the runs API via the Vite proxy (`/runs` → `localhost:5173`).

## New files

| File | Purpose |
|------|---------|
| `frontend/src/api/runs.ts` | `createRun`, `listRuns`, `getRun` with error handling |
| `frontend/src/lib/runDisplay.ts` | Tool labels, timeline mapping, terminal/final answer messages |

## Updated files

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Loads past runs on mount; Run → POST + GET detail; sidebar click → GET detail; loading/error/submit state |
| `frontend/src/types.ts` | `RunStatus` aligned with backend terminal states + `loading` |
| `frontend/src/components/StatusBanner.tsx` | Labels for all statuses |
| `frontend/src/index.css` | Status indicator styles + `.app-error` |

## Behavior

- **On load** — `GET /runs` fills the sidebar (newest first from API)
- **Run** — `POST /runs` with `{ goal }`, then `GET /runs/:id`; button disabled while submitting
- **Past run click** — fetches and shows that run’s timeline and answer
- **Timeline** — friendly tool names (e.g. `search_docs` → “Searched documents”)
- **Final answer** — `succeeded` shows `final_answer`; other terminals show the required human-readable messages
- **Errors** — red alert banner; no spinners (status text: “Run in progress” / “Loading run…”)

Run `npm run dev:api` and `npm run dev:ui` to try it end-to-end.

---

**User**

Right now:

Run completed

But make it this:

Succeeded
Stuck
Cost limit reached
Step limit reached
Timed out
Error

Hide old test goals from older testing:
test goal
hello
hello world

and

status: completed

---

**Cursor**

Updated the status banner labels and filtered old test runs from the sidebar.

## Status banner (`StatusBanner.tsx`)

| Status | Label |
|--------|--------|
| `succeeded` | Succeeded |
| `stuck` | Stuck |
| `cost_cap` | Cost limit reached |
| `step_cap` | Step limit reached |
| `timeout` | Timed out |
| `error` | Error |

(Idle / loading / running labels unchanged.)

## Sidebar filter (`runDisplay.ts` + `App.tsx`)

Past runs are hidden when:
- Goal is `test goal`, `hello`, or `hello world` (case-insensitive, trimmed)
- Status is `completed` (legacy)

## Legacy `completed` runs

If one is loaded directly, it still shows as **Succeeded** in the banner and uses `final_answer` when present.

---

**User**

Next Goal:
Add focused backend tests for the assignment requirements.

Use Vitest.

Add tests for:

1. Tool retrieval ranking
- goal "weather" includes fetch_weather in top 5
- goal "policy docs" includes search_docs, fetch_doc, summarise_text in top 5

2. Stuck detection
- running goal "stuck" ends with status/reason "stuck"

3. Step cap
- running goal "stuck" with maxSteps 2 ends with reason "step_cap"

4. Cost cap
- running goal "policy docs" with very low maxCostUsd ends with reason "cost_cap"

5. Retry classification
- recoverable tool error retries once and succeeds for fetch_weather Melbourne
- non-recoverable tool error from send_email missing recipient does not retry

6. Integration test
- create a run for "policy docs"
- run the agent
- assert run is succeeded
- assert steps were persisted
- assert final_answer is present

Requirements:
- Use isolated test database setup
- Do not depend on existing local backend/data/agentkit.db
- Keep tests simple and behaviour-focused
- Do not over-test implementation details
- Do not add frontend tests
- Do not modify runtime behavior unless a test exposes a real bug

Return summary of tests added and how to run them.

---

**Cursor**

Adding isolated test DB helpers and focused Vitest tests.


Adding retrieval keywords so `summarise_text` ranks in the top 5 for policy/docs goals (required by the test).


Added focused Vitest coverage for the assignment requirements.

## How to run

From the repo root:

```bash
npm test -w backend
```

From `backend/`:

```bash
npm test
```

## Test files (8 tests)

| File | Tests |
|------|--------|
| `test/retrieval.test.ts` | `"weather"` → `fetch_weather` in top 5; `"policy docs"` → `search_docs`, `fetch_doc`, `summarise_text` in top 5 |
| `test/runtime-guards.test.ts` | `"stuck"` → `stuck`; `"stuck"` + `maxSteps: 2` → `step_cap`; `"policy docs"` + low `maxCostUsd` → `cost_cap` |
| `test/tool-retry.test.ts` | Melbourne `fetch_weather` retries once (2 executes, succeeds); `send_email` without recipient does not retry (1 execute) |
| `test/integration.test.ts` | `"policy docs"` run → `succeeded`, steps persisted, `final_answer` set |

## Test infrastructure

- `test/helpers.ts` — `setupTestDb()` / `teardownTestDb()` using in-memory SQLite (`:memory:`), not `backend/data/agentkit.db`
- `db/client.ts` — `initTestDb()`, `closeDb()`
- `tools/registry.ts` — `resetRegistryTestState()` clears Melbourne weather state between tests
- `runtime/loop.ts` — exported `executeToolWithRetry` for retry behaviour tests

## Small fix exposed by tests

`summarise_text` was outside the top 5 for `"policy docs"`. Added `"docs"` and `"policy"` to its keywords in `registry.ts` so retrieval matches the docs scenario (same pattern as `"stuck"` on `search_docs`).

---

**User**

Lets' implement the final piece the readME for this. 

Create a professional README.md for AgentKit.

Sections:

# AgentKit

A short description of the project.

## What It Does

Explain:

- goal submission
- tool retrieval
- deterministic mock LLM
- tool execution
- persistence
- safety guards
- run history

## Architecture

Describe:

Frontend
- React
- Vite
- TypeScript

Backend
- Fastify
- SQLite
- Vitest

Agent Flow

Goal
→ Tool Retrieval
→ Mock LLM
→ Tool Execution
→ Persistence
→ Final Answer

## Safety Guards

Describe:

- step cap
- cost cap
- stuck detection
- timeout guard
- retry handling

## API

Document:

POST /runs

GET /runs

GET /runs/:run_id

Include example request/response payloads.

## Running Locally

Include:

npm install

npm run dev:api

npm run dev:ui

npm test -w backend

## Tests

Describe the implemented test coverage:

- retrieval ranking
- stuck detection
- step cap
- cost cap
- retry behaviour
- integration test

## Design Decisions

Explain:

### Why SQLite?

Simple local persistence with minimal setup overhead.

### Why deterministic mock LLM?

Predictable behaviour and repeatable tests.

### Why keyword retrieval?

Simple implementation suitable for the time-boxed assignment.

### Why persist every step?

Auditability, debugging and replayability.

## Known Limitations

Examples:

- synchronous execution
- deterministic mock LLM
- keyword retrieval rather than embeddings
- no streaming updates
- no authentication

## Future Improvements

Examples:

- async job execution
- streaming updates
- richer planning logic
- vector retrieval
- real LLM integration

## AI Assist Log

Be transparent.

State that AI tools were used for:

- scaffolding
- code generation
- test generation
- documentation drafting

State that all generated code was reviewed, modified, integrated and validated manually.

## Prompt History

Reference the prompts/ folder and explain that prompt history is included as requested.

Keep tone professional and concise.

Do not oversell the project.
Do not claim production readiness.

---

**Cursor**

Created a full **README.md** at the repo root with the sections you listed: overview, behaviour, architecture, safety guards, API (with example payloads), local run instructions, test coverage, design decisions, limitations, future work, AI assist log, and prompt history.

Also added **`prompts/README.md`** so the README link to `prompts/` works and you have a place to drop exported prompt logs.

Tone is factual and assignment-focused—no production-readiness claims. Ports, defaults, and test commands match the current codebase (`4000` / `5173`, `npm test -w backend`).


