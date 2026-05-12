import { Router } from 'express';
import { db } from '../db/index.js';
import { idFor } from '../lib/uid.js';
import { ah, HttpError } from '../middleware/error.js';

const r = Router();

// POST /api/projects/:projectId/edges
r.post('/projects/:projectId/edges', ah(async (req, res) => {
  const { projectId } = req.params;
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new HttpError(404, 'Project not found');

  const {
    source_id, target_id,
    source_handle = null, target_handle = null,
    label = 'data', payload = null, auth = 'None',
  } = req.body || {};

  if (!source_id || !target_id) throw new HttpError(400, 'source_id and target_id are required');

  // Validate both endpoints belong to this project
  const endpoints = db.prepare(
    `SELECT id FROM nodes WHERE project_id = ? AND id IN (?, ?)`
  ).all(projectId, source_id, target_id);
  if (endpoints.length < 2) throw new HttpError(400, 'source and target must exist in this project');

  const id = idFor('edge');
  db.prepare(`INSERT INTO edges
    (id, project_id, source_id, target_id, source_handle, target_handle, label, payload, auth)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, projectId, source_id, target_id, source_handle, target_handle, label, payload, auth);

  db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(projectId);
  res.status(201).json(db.prepare('SELECT * FROM edges WHERE id = ?').get(id));
}));

// PUT /api/edges/:id
r.put('/edges/:id', ah(async (req, res) => {
  const existing = db.prepare('SELECT * FROM edges WHERE id = ?').get(req.params.id);
  if (!existing) throw new HttpError(404, 'Edge not found');

  const fields = ['label', 'payload', 'auth', 'source_handle', 'target_handle'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(req.body, f)) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (updates.length === 0) return res.json(existing);
  values.push(req.params.id);
  db.prepare(`UPDATE edges SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(existing.project_id);
  res.json(db.prepare('SELECT * FROM edges WHERE id = ?').get(req.params.id));
}));

// DELETE /api/edges/:id
r.delete('/edges/:id', ah(async (req, res) => {
  const edge = db.prepare('SELECT project_id FROM edges WHERE id = ?').get(req.params.id);
  if (!edge) throw new HttpError(404, 'Edge not found');
  db.prepare('DELETE FROM edges WHERE id = ?').run(req.params.id);
  db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(edge.project_id);
  res.status(204).end();
}));

export default r;
