// Ownership lookups. Each returns the row (with its project_id) only when the
// project belongs to `userId`; otherwise it throws 404, so other users'
// resources are indistinguishable from missing ones.
import { db } from '../db/index.js';
import { HttpError } from '../middleware/error.js';

export function ownedProject(projectId, userId) {
  const row = db.prepare(`SELECT * FROM projects WHERE id = ? AND user_id = ?`).get(projectId, userId);
  if (!row) throw new HttpError(404, 'Project not found');
  return row;
}

export function ownedNode(nodeId, userId) {
  const row = db.prepare(`
    SELECT n.* FROM nodes n JOIN projects p ON p.id = n.project_id
    WHERE n.id = ? AND p.user_id = ?`).get(nodeId, userId);
  if (!row) throw new HttpError(404, 'Node not found');
  return row;
}

export function ownedEdge(edgeId, userId) {
  const row = db.prepare(`
    SELECT e.* FROM edges e JOIN projects p ON p.id = e.project_id
    WHERE e.id = ? AND p.user_id = ?`).get(edgeId, userId);
  if (!row) throw new HttpError(404, 'Edge not found');
  return row;
}

export function ownedThreat(threatId, userId) {
  const row = db.prepare(`
    SELECT t.*, n.project_id AS project_id FROM threats t
    JOIN nodes n ON n.id = t.node_id JOIN projects p ON p.id = n.project_id
    WHERE t.id = ? AND p.user_id = ?`).get(threatId, userId);
  if (!row) throw new HttpError(404, 'Threat not found');
  return row;
}

export function touchProject(projectId) {
  db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(projectId);
}
