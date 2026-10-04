# ThreatForge

A web-based cyber threat modeling workbench with **STRIDE analysis**, built on React Flow with a Node.js/Express backend and SQLite persistence.

## Architecture

```
threatforge/
├── client/          # Vite + React + React Flow (port 5173)
├── server/          # Express + SQLite REST API   (port 4000)
└── package.json     # npm workspaces root
```

- **Frontend** consumes a REST API and auto-saves all changes (node moves debounced, edits immediate). Styled with the SERG Threat Modeler design system (IBM Plex Sans + JetBrains Mono, mint accent).
- **Backend** exposes a CRUD API for projects, nodes, edges and threats; persists to a single SQLite file at `server/data/threatforge.db`.
- **Accounts** — every project belongs to a user. Passwords are hashed with scrypt; sessions are random tokens in an `HttpOnly`, `SameSite=Lax` cookie (only a SHA-256 of the token is stored). Failed sign-ins are throttled per IP + email.
- **Dev proxy**: Vite proxies `/api/*` to the backend, so the frontend just calls relative URLs.

## Prerequisites

- Node.js **22.5+** (uses the built-in `node:sqlite` module — no native compilation, no `node-gyp`, no Python)
- npm 10+ (for workspaces)

> **Why 22.5+?** We use Node's built-in SQLite to avoid the `prebuild-install` / `node-gyp` headache that comes with native modules. If you must run on Node 18/20, swap `server/src/db/index.js` to use `better-sqlite3` and add it to `server/package.json` dependencies.

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

Open the client URL and sign in with the seeded demo account — **`demo@threatforge.local` / `threatmodel`** — or create your own account. (Set `SEED_PASSWORD` before `db:seed` to choose a different demo password.)

> **Upgrading an existing database:** projects created before accounts existed have no owner and are hidden. Run `npm run db:seed` once — it creates the demo account and assigns any ownerless projects to it.

## Run pieces individually

```bash
npm run dev:server    # just the API
npm run dev:client    # just the frontend
```

## Build for production

```bash
npm run build         # builds the client into client/dist
NODE_ENV=production npm run start   # runs the API and serves client/dist (cookies marked Secure → serve over HTTPS)
```

## API surface

All routes are JSON. Everything except `/api/health` and `/api/auth/*` requires a signed-in session; other users' resources return 404.

| Method | Path                                    | Purpose                                |
|--------|-----------------------------------------|----------------------------------------|
| POST   | `/api/auth/signup`                      | Create account (starts a session)      |
| POST   | `/api/auth/login`                       | Sign in                                |
| POST   | `/api/auth/logout`                      | Sign out                               |
| GET    | `/api/auth/me`                          | Current user                           |
| PUT    | `/api/auth/me`                          | Update profile (name, affiliation)     |
| GET    | `/api/projects`                         | List your projects with threat stats   |
| GET    | `/api/projects/attention`               | Highest-severity open threats          |
| POST   | `/api/projects/import`                  | Import a `.stm.json` model file        |
| GET    | `/api/projects/:id/export`              | Download a `.stm.json` model file      |
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
users (1) ─── (many) sessions
  └── (many) projects (1) ─── (many) nodes (1) ─── (many) threats
                   └─────── (many) edges ────────┘
```

See `server/src/db/schema.sql` for full DDL with constraints and cascade rules.

## License

MIT
