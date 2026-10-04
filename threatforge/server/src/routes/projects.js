import { Router } from 'express';
import { db } from '../db/index.js';
import { idFor } from '../lib/uid.js';
import { ah, HttpError } from '../middleware/error.js';
import { ownedProject } from '../lib/access.js';
import { exportModel, importModel } from '../lib/modelfile.js';

const r = Router();
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const SEV_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// ---------------------------------------------------------------------------
// LIST (with per-project threat stats for the overview dashboard)
// ---------------------------------------------------------------------------
r.get('/', ah(async (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
           (SELECT COUNT(*) FROM nodes WHERE project_id = p.id AND type != 'boundary') AS node_count,
           (SELECT COUNT(*) FROM edges WHERE project_id = p.id) AS edge_count
    FROM projects p
    WHERE p.user_id = ?
    ORDER BY p.updated_at DESC
  `).all(req.user.id);

  const threats = db.prepare(`
    SELECT t.stride, t.severity, t.mitigation, n.project_id
    FROM threats t JOIN nodes n ON n.id = t.node_id JOIN projects p ON p.id = n.project_id
    WHERE p.user_id = ?
  `).all(req.user.id);

  const byProject = new Map(rows.map((p) => [p.id, []]));
  threats.forEach((t) => byProject.get(t.project_id)?.push(t));

  res.json(rows.map((p) => {
    const ts = byProject.get(p.id);
    const open = ts.filter((t) => t.mitigation === 'Open');
    const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, ts.filter((t) => t.severity === s).length]));
    const byStride = Object.fromEntries('STRIDE'.split('').map((k) => [k, ts.filter((t) => t.stride === k).length]));
    return {
      ...p,
      threat_count: ts.length,
      stats: {
        total: ts.length,
        open: open.length,
        openCritical: open.filter((t) => t.severity === 'Critical').length,
        mitigated: ts.filter((t) => t.mitigation === 'Mitigated').length,
        bySeverity,
        byStride,
      },
    };
  }));
}));

// ---------------------------------------------------------------------------
// NEEDS ATTENTION – highest-severity open threats across the user's projects
// ---------------------------------------------------------------------------
r.get('/attention', ah(async (req, res) => {
  const rows = db.prepare(`
    SELECT t.id, t.stride, t.severity, t.description, n.id AS node_id, n.label AS node_label,
           p.id AS project_id, p.name AS project_name
    FROM threats t JOIN nodes n ON n.id = t.node_id JOIN projects p ON p.id = n.project_id
    WHERE p.user_id = ? AND t.mitigation = 'Open'
  `).all(req.user.id);
  rows.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
  res.json(rows.slice(0, 6));
}));

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
r.post('/', ah(async (req, res) => {
  const { name, description = null } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'name is required');
  const id = idFor('proj');
  db.prepare(`INSERT INTO projects (id, user_id, name, description) VALUES (?, ?, ?, ?)`)
    .run(id, req.user.id, name.trim(), description);
  res.status(201).json(db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id));
}));

// ---------------------------------------------------------------------------
// IMPORT (.stm.json model file)
// ---------------------------------------------------------------------------
r.post('/import', ah(async (req, res) => {
  const { project, skipped } = importModel(req.body, req.user.id);
  res.status(201).json({ project, skipped });
}));

// ---------------------------------------------------------------------------
// READ (assemble full project tree)
// ---------------------------------------------------------------------------
r.get('/:id', ah(async (req, res) => {
  const project = ownedProject(req.params.id, req.user.id);

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
// EXPORT (.stm.json model file)
// ---------------------------------------------------------------------------
r.get('/:id/export', ah(async (req, res) => {
  const project = ownedProject(req.params.id, req.user.id);
  const filename = `${project.name.replace(/[^a-z0-9._-]+/gi, '_')}.stm.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(exportModel(project));
}));

// ---------------------------------------------------------------------------
// UPDATE metadata
// ---------------------------------------------------------------------------
r.put('/:id', ah(async (req, res) => {
  const { name, description } = req.body || {};
  const existing = ownedProject(req.params.id, req.user.id);

  db.prepare(`UPDATE projects SET
    name = COALESCE(?, name),
    description = COALESCE(?, description),
    updated_at = datetime('now')
    WHERE id = ?`).run(name ?? null, description ?? null, existing.id);

  res.json(db.prepare(`SELECT * FROM projects WHERE id = ?`).get(existing.id));
}));

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
r.delete('/:id', ah(async (req, res) => {
  const existing = ownedProject(req.params.id, req.user.id);
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(existing.id);
  res.status(204).end();
}));

// ---------------------------------------------------------------------------
// REPORT (Markdown)
// ---------------------------------------------------------------------------
// Keep user text from breaking table rows or line structure.
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

r.get('/:id/report', ah(async (req, res) => {
  const project = ownedProject(req.params.id, req.user.id);

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
      lines.push(`| ${t.stride} ${STRIDE_NAMES[t.stride]} | ${t.severity} | ${t.mitigation} | ${cell(t.description)} | ${cell(t.control) || '—'} |`);
    });
  }

  res.type('text/markdown').send(lines.join('\n'));
}));

export default r;
