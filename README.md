# AgentKit

Minimal agent-runtime service with tool calling, safety guards, persistence, and a small frontend.

## Stack

- **Backend:** TypeScript, Fastify, SQLite (better-sqlite3), Vitest
- **Frontend:** Vite, React, TypeScript

## Setup

```bash
npm install
```

## Development

```bash
# API (default http://localhost:5173)
npm run dev:api

# UI (default http://localhost:4000)
npm run dev:ui
```

## API (planned)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/runs` | Create a run |
| GET | `/runs` | List recent runs |
| GET | `/runs/:run_id` | Get run state and steps |

## License

Private — assignment scaffold.
