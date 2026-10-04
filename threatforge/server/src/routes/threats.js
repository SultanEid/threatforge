import { Router } from 'express';
import { db } from '../db/index.js';
import { idFor } from '../lib/uid.js';
import { ah, HttpError } from '../middleware/error.js';
import { ownedNode, ownedThreat, touchProject } from '../lib/access.js';

const r = Router();

// POST /api/nodes/:nodeId/threats
r.post('/nodes/:nodeId/threats', ah(async (req, res) => {
  const node = ownedNode(req.params.nodeId, req.user.id);

  const { stride, severity, description, control = null, mitigation = 'Open' } = req.body || {};
  if (!['S','T','R','I','D','E'].includes(stride)) throw new HttpError(400, 'invalid stride');
  if (!['Critical','High','Medium','Low'].includes(severity)) throw new HttpError(400, 'invalid severity');
  if (!description || typeof description !== 'string') throw new HttpError(400, 'description is required');

  const id = idFor('thr');
  db.prepare(`INSERT INTO threats (id, node_id, stride, severity, description, control, mitigation)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.params.nodeId, stride, severity, description, control, mitigation);

  touchProject(node.project_id);
  res.status(201).json(db.prepare('SELECT * FROM threats WHERE id = ?').get(id));
}));

// PUT /api/threats/:id
r.put('/threats/:id', ah(async (req, res) => {
  const existing = ownedThreat(req.params.id, req.user.id);

  const fields = ['stride', 'severity', 'description', 'control', 'mitigation'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(req.body, f)) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (updates.length === 0) {
    const { project_id, ...rest } = existing;
    return res.json(rest);
  }
  updates.push(`updated_at = datetime('now')`);
  values.push(req.params.id);
  db.prepare(`UPDATE threats SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  touchProject(existing.project_id);
  res.json(db.prepare('SELECT * FROM threats WHERE id = ?').get(req.params.id));
}));

// DELETE /api/threats/:id
r.delete('/threats/:id', ah(async (req, res) => {
  const existing = ownedThreat(req.params.id, req.user.id);
  db.prepare('DELETE FROM threats WHERE id = ?').run(req.params.id);
  touchProject(existing.project_id);
  res.status(204).end();
}));

export default r;
