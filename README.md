# threatforge

unzip threatforge-fullstack.zip
cd threatforge
npm run install:all
npm run db:migrate
npm run db:seed
npm run dev


Open http://localhost:5173 — you'll see the seeded e-commerce model with its pre-populated threats.

How the front-end is linked to the backend

Vite proxies /api/* → http://localhost:4000 (no CORS pain in dev)
api/client.js is the single fetch layer; every panel calls through it
hooks/useProject.js orchestrates everything: loads the project on mount, dispatches optimistic updates to React Flow state, then syncs to the API
Node drags are debounced (250ms) per node id; clicks/edits sync immediately
Sync indicator pulses green/amber/red in the top bar based on request state

API endpoints (full list in README.md):
GET/POST     /api/projects
GET/PUT/DEL  /api/projects/:id
GET          /api/projects/:id/report     ← markdown threat register
POST         /api/projects/:id/nodes
PUT/DEL      /api/nodes/:id
POST         /api/projects/:id/edges
PUT/DEL      /api/edges/:id
POST         /api/nodes/:id/threats
PUT/DEL      /api/threats/:id
