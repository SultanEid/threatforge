-- ThreatForge schema
-- All IDs are short random strings (generated server-side).
-- Cascade deletes maintain referential integrity.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nodes (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('external','process','datastore','boundary')),
  position_x      REAL NOT NULL DEFAULT 0,
  position_y      REAL NOT NULL DEFAULT 0,
  label           TEXT,
  classification  TEXT,
  technology      TEXT,
  description     TEXT,
  zone            TEXT,
  width           REAL,
  height          REAL,
  z_index         INTEGER DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nodes_project ON nodes(project_id);

CREATE TABLE IF NOT EXISTS edges (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL,
  source_id     TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  label         TEXT,
  payload       TEXT,
  auth          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id)  REFERENCES nodes(id)    ON DELETE CASCADE,
  FOREIGN KEY (target_id)  REFERENCES nodes(id)    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_edges_project ON edges(project_id);
CREATE INDEX IF NOT EXISTS idx_edges_source  ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target  ON edges(target_id);

CREATE TABLE IF NOT EXISTS threats (
  id          TEXT PRIMARY KEY,
  node_id     TEXT NOT NULL,
  stride      TEXT NOT NULL CHECK (stride IN ('S','T','R','I','D','E')),
  severity    TEXT NOT NULL CHECK (severity IN ('Critical','High','Medium','Low')),
  description TEXT NOT NULL,
  control     TEXT,
  mitigation  TEXT NOT NULL DEFAULT 'Open' CHECK (mitigation IN ('Open','Mitigated','Accepted')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_threats_node ON threats(node_id);
