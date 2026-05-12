# ThreatForge

A web-based cyber threat modeling workbench with **STRIDE analysis**, built on React Flow with a Node.js/Express backend and SQLite persistence.

## Architecture

```
threatforge/
├── client/          # Vite + React + React Flow (port 5173)
├── server/          # Express + SQLite REST API   (port 4000)
└── package.json     # npm workspaces root
```

- **Frontend** consumes a REST API and auto-saves all changes (node moves debounced, edits immediate).
- **Backend** exposes a CRUD API for projects, nodes, edges and threats; persists to a single SQLite file at `server/data/threatforge.db`.
- **Dev proxy**: Vite proxies `/api/*` to the backend, so the frontend just calls relative URLs.

## Prerequisites

- Node.js **18+** (for native fetch in tests, ES modules everywhere)
- npm 9+ (for workspaces)

## Setup

```bash
# Install all workspace dependencies
npm run install:all

# Create the SQLite schema + seed an example project
npm run db:migrate
npm run db:seed
```

## Run (dev)

```bash
npm run dev
```

This boots both processes side-by-side:

- API:    http://localhost:4000
- Client: http://localhost:5173

Open the client URL in your browser — you should see the seeded example project.

## Run pieces individually

```bash
npm run dev:server    # just the API
npm run dev:client    # just the frontend
```

## Build for production

```bash
npm run build         # builds the client into client/dist
npm run start         # runs the API; can serve client/dist as static
```

## API surface

All routes are JSON.

| Method | Path                                    | Purpose                                |
|--------|-----------------------------------------|----------------------------------------|
| GET    | `/api/projects`                         | List all projects                      |
| POST   | `/api/projects`                         | Create project                         |
| GET    | `/api/projects/:id`                     | Full project (nodes, edges, threats)   |
| PUT    | `/api/projects/:id`                     | Update project metadata                |
| DELETE | `/api/projects/:id`                     | Delete project (cascade)               |
| POST   | `/api/projects/:id/nodes`               | Create node                            |
| PUT    | `/api/nodes/:id`                        | Update node (position/data)            |
| DELETE | `/api/nodes/:id`                        | Delete node                            |
| POST   | `/api/projects/:id/edges`               | Create edge                            |
| PUT    | `/api/edges/:id`                        | Update edge                            |
| DELETE | `/api/edges/:id`                        | Delete edge                            |
| POST   | `/api/nodes/:id/threats`                | Add threat to a node                   |
| PUT    | `/api/threats/:id`                      | Update threat                          |
| DELETE | `/api/threats/:id`                      | Delete threat                          |
| GET    | `/api/projects/:id/report`              | Markdown threat report                 |
| GET    | `/api/health`                           | Health probe                           |

## Data model

```
projects (1) ─── (many) nodes (1) ─── (many) threats
       └─────── (many) edges ────────┘
```

See `server/src/db/schema.sql` for full DDL with constraints and cascade rules.

## License

MIT
