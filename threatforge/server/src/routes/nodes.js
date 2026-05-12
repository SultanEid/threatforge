import { Router } from 'express';
import { db } from '../db/index.js';
import { idFor } from '../lib/uid.js';
import { ah, HttpError } from '../middleware/error.js';

const r = Router();

// POST /api/projects/:projectId/nodes
r.post('/projects/:projectId/nodes', ah(async (req, res) => {
  const { projectId } = req.params;
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) throw new HttpError(404, 'Project not found');

  const {
    type, position_x = 0, position_y = 0,
    label = null, classification = null, technology = null, description = null,
    zone = null, width = null, height = null, z_index = 0,
  } = req.body || {};

  if (!['external', 'process', 'datastore', 'boundary'].includes(type)) {
    throw new HttpError(400, 'invalid node type');
  }

  const id = idFor('node');
  db.prepare(`INSERT INTO nodes
    (id, project_id, type, position_x, position_y, label, classification, technology, description, zone, width, height, z_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, projectId, type, position_x, position_y, label, classification, technology, description, zone, width, height, z_index);

  touchProject(projectId);
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
  res.status(201).json({ ...node, threats: [] });
}));

// PUT /api/nodes/:id
r.put('/nodes/:id', ah(async (req, res) => {
  const existing = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!existing) throw new HttpError(404, 'Node not found');

  const fields = ['position_x', 'position_y', 'label', 'classification', 'technology', 'description', 'zone', 'width', 'height', 'z_index'];
  const updates = [];
  const values = [];

  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(req.body, f)) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (updates.length === 0) return res.json(existing);

  updates.push(`updated_at = datetime('now')`);
  values.push(req.params.id);
  db.prepare(`UPDATE nodes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  touchProject(existing.project_id);

  const fresh = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  const threats = db.prepare('SELECT * FROM threats WHERE node_id = ?').all(req.params.id);
  res.json({ ...fresh, threats });
}));

// DELETE /api/nodes/:id
r.delete('/nodes/:id', ah(async (req, res) => {
  const node = db.prepare('SELECT project_id FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) throw new HttpError(404, 'Node not found');
  db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.id);
  touchProject(node.project_id);
  res.status(204).end();
}));

function touchProject(projectId) {
  db.prepare(`UPDATE projects SET updated_at = datetime('now') WHERE id = ?`).run(projectId);
}

export default r;
