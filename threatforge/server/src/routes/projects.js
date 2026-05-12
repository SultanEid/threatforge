import { Router } from 'express';
import { db } from '../db/index.js';
import { idFor } from '../lib/uid.js';
import { ah, HttpError } from '../middleware/error.js';

const r = Router();

// ---------------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------------
r.get('/', ah(async (_req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
           (SELECT COUNT(*) FROM nodes  WHERE project_id = p.id) AS node_count,
           (SELECT COUNT(*) FROM edges  WHERE project_id = p.id) AS edge_count,
           (SELECT COUNT(*) FROM threats t JOIN nodes n ON n.id = t.node_id WHERE n.project_id = p.id) AS threat_count
    FROM projects p
    ORDER BY p.updated_at DESC
  `).all();
  res.json(rows);
}));

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
r.post('/', ah(async (req, res) => {
  const { name, description = null } = req.body || {};
  if (!name || typeof name !== 'string') throw new HttpError(400, 'name is required');
  const id = idFor('proj');
  db.prepare(`INSERT INTO projects (id, name, description) VALUES (?, ?, ?)`).run(id, name, description);
  res.status(201).json({ id, name, description });
}));

// ---------------------------------------------------------------------------
// READ (assemble full project tree)
// ---------------------------------------------------------------------------
r.get('/:id', ah(async (req, res) => {
  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');

  const nodes = db.prepare(`SELECT * FROM nodes WHERE project_id = ?`).all(project.id);
  const edges = db.prepare(`SELECT * FROM edges WHERE project_id = ?`).all(project.id);
  const threats = db.prepare(`
    SELECT t.* FROM threats t
    JOIN nodes n ON n.id = t.node_id
    WHERE n.project_id = ?
  `).all(project.id);

  // Attach threats to their nodes
  const byNode = new Map();
  threats.forEach((t) => {
    if (!byNode.has(t.node_id)) byNode.set(t.node_id, []);
    byNode.get(t.node_id).push(t);
  });
  const enrichedNodes = nodes.map((n) => ({ ...n, threats: byNode.get(n.id) || [] }));

  res.json({ project, nodes: enrichedNodes, edges });
}));

// ---------------------------------------------------------------------------
// UPDATE metadata
// ---------------------------------------------------------------------------
r.put('/:id', ah(async (req, res) => {
  const { name, description } = req.body || {};
  const existing = db.prepare(`SELECT id FROM projects WHERE id = ?`).get(req.params.id);
  if (!existing) throw new HttpError(404, 'Project not found');

  db.prepare(`UPDATE projects SET
    name = COALESCE(?, name),
    description = COALESCE(?, description),
    updated_at = datetime('now')
    WHERE id = ?`).run(name ?? null, description ?? null, req.params.id);

  res.json(db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id));
}));

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
r.delete('/:id', ah(async (req, res) => {
  const result = db.prepare(`DELETE FROM projects WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) throw new HttpError(404, 'Project not found');
  res.status(204).end();
}));

// ---------------------------------------------------------------------------
// REPORT (Markdown)
// ---------------------------------------------------------------------------
r.get('/:id/report', ah(async (req, res) => {
  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(req.params.id);
  if (!project) throw new HttpError(404, 'Project not found');

  const nodes = db.prepare(`SELECT * FROM nodes WHERE project_id = ? AND type != 'boundary'`).all(project.id);
  const allThreats = db.prepare(`
    SELECT t.*, n.label AS node_label FROM threats t
    JOIN nodes n ON n.id = t.node_id WHERE n.project_id = ?
  `).all(project.id);

  const sevCount = (s) => allThreats.filter((t) => t.severity === s && t.mitigation !== 'Mitigated').length;

  const STRIDE_NAMES = { S:'Spoofing', T:'Tampering', R:'Repudiation', I:'Information Disclosure', D:'Denial of Service', E:'Elevation of Privilege' };

  const lines = [];
  lines.push(`# Threat Model: ${project.name}`);
  lines.push('');
  if (project.description) { lines.push(`> ${project.description}`); lines.push(''); }
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`## Summary`);
  lines.push(`- Elements: **${nodes.length}**`);
  lines.push(`- Total Threats: **${allThreats.length}** (${allThreats.filter(t => t.mitigation !== 'Mitigated').length} open)`);
  lines.push(`- Open by severity: Critical ${sevCount('Critical')} · High ${sevCount('High')} · Medium ${sevCount('Medium')} · Low ${sevCount('Low')}`);
  lines.push('');
  lines.push(`## Element Threat Register`);

  for (const n of nodes) {
    lines.push(`\n### ${n.label || n.id} _(${n.type})_`);
    if (n.classification) lines.push(`- Classification: **${n.classification}**`);
    if (n.technology)     lines.push(`- Technology: ${n.technology}`);
    if (n.description)    lines.push(`- ${n.description}`);

    const ts = allThreats.filter((t) => t.node_id === n.id);
    if (ts.length === 0) { lines.push(`- _No threats documented._`); continue; }
    lines.push('');
    lines.push(`| STRIDE | Severity | Status | Threat | Control |`);
    lines.push(`|---|---|---|---|---|`);
    ts.forEach((t) => {
      lines.push(`| ${t.stride} ${STRIDE_NAMES[t.stride]} | ${t.severity} | ${t.mitigation} | ${t.description} | ${t.control || '—'} |`);
    });
  }

  res.type('text/markdown').send(lines.join('\n'));
}));

export default r;
