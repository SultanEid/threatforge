// .stm.json model files – the SERG threat-modeler interchange format:
//   { format: 'serg-threatmodeler', version: 1, exported, model: {
//       name, description, elements: [{id, name, type, x, y}],
//       flows: [{id, from, to, label, dashed}],
//       threats: [{id, title, stride, sev, status, element}] } }
// ThreatForge-specific fields (classification, technology, control, zone,
// payload, auth, ...) ride along as extra keys and are restored on import.
import { db } from '../db/index.js';
import { idFor } from './uid.js';
import { HttpError } from '../middleware/error.js';

const FORMAT = 'serg-threatmodeler';
const MAX = { elements: 1000, flows: 3000, threats: 5000 };

const TYPE_OUT = { external: 'external', process: 'process', datastore: 'store', boundary: 'boundary' };
const TYPE_IN = { external: 'external', process: 'process', store: 'datastore', datastore: 'datastore', boundary: 'boundary' };
const SEV_IN = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Low' };
const STATUS_IN = {
  open: 'Open', investigating: 'Open', mitigated: 'Mitigated', verified: 'Mitigated', accepted: 'Accepted',
};
const STRIDE = ['S', 'T', 'R', 'I', 'D', 'E'];
const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Secret'];

const ms = (sqlDate) => (sqlDate ? Date.parse(sqlDate.replace(' ', 'T') + 'Z') : null);
const text = (v, max = 2000) => (v == null ? null : String(v).slice(0, max));
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

export function exportModel(project) {
  const nodes = db.prepare(`SELECT * FROM nodes WHERE project_id = ?`).all(project.id);
  const edges = db.prepare(`SELECT * FROM edges WHERE project_id = ?`).all(project.id);
  const threats = db.prepare(`
    SELECT t.* FROM threats t JOIN nodes n ON n.id = t.node_id WHERE n.project_id = ?`).all(project.id);

  return {
    format: FORMAT,
    version: 1,
    exported: new Date().toISOString(),
    model: {
      id: project.id,
      name: project.name,
      description: project.description || '',
      created: ms(project.created_at),
      updated: ms(project.updated_at),
      lastRun: null,
      elements: nodes.map((n) => ({
        id: n.id, name: n.label || '', type: TYPE_OUT[n.type], x: n.position_x, y: n.position_y,
        classification: n.classification, technology: n.technology, description: n.description,
        zone: n.zone, width: n.width, height: n.height,
      })),
      flows: edges.map((e) => ({
        id: e.id, from: e.source_id, to: e.target_id, label: e.label || '', dashed: false,
        payload: e.payload, auth: e.auth,
      })),
      threats: threats.map((t) => ({
        id: t.id, title: t.description, stride: t.stride, sev: t.severity.toLowerCase(),
        status: t.mitigation.toLowerCase(), element: t.node_id, control: t.control,
      })),
    },
  };
}

// Creates a new project for `userId` from a parsed model file. All IDs are
// regenerated; threats whose element is a flow attach to the flow's target.
export function importModel(data, userId) {
  const m = data && data.format === FORMAT ? data.model : data;
  if (!m || typeof m.name !== 'string' || !Array.isArray(m.elements) || !Array.isArray(m.threats)) {
    throw new HttpError(400, 'Not a model file: missing name, elements, or threats.');
  }
  const flows = Array.isArray(m.flows) ? m.flows : [];
  if (m.elements.length > MAX.elements || flows.length > MAX.flows || m.threats.length > MAX.threats) {
    throw new HttpError(400, 'Model file is too large.');
  }

  const projectId = idFor('proj');
  const nodeIds = new Map();
  const flowTarget = new Map();
  let skipped = 0;

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO projects (id, user_id, name, description) VALUES (?, ?, ?, ?)`)
      .run(projectId, userId, text(m.name, 200).trim() || 'untitled-model', text(m.description));

    const insNode = db.prepare(`INSERT INTO nodes
      (id, project_id, type, position_x, position_y, label, classification, technology, description, zone, width, height, z_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    m.elements.forEach((e, i) => {
      if (!e) { skipped++; return; }
      const type = TYPE_IN[e.type] || 'process';
      const id = idFor('node');
      nodeIds.set(String(e.id ?? `#${i}`), id);
      insNode.run(id, projectId, type,
        num(e.x) ?? 60 + (i % 3) * 280, num(e.y) ?? 60 + Math.floor(i / 3) * 130,
        text(e.name, 200) || 'Element',
        CLASSIFICATIONS.includes(e.classification) ? e.classification : null,
        text(e.technology, 200), text(e.description),
        type === 'boundary' ? text(e.zone, 40) || 'TRUSTED' : null,
        type === 'boundary' ? num(e.width) ?? 280 : null,
        type === 'boundary' ? num(e.height) ?? 200 : null,
        type === 'boundary' ? -1 : 0);
    });

    const insEdge = db.prepare(`INSERT INTO edges
      (id, project_id, source_id, target_id, label, payload, auth) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    flows.forEach((f) => {
      const from = f && nodeIds.get(String(f.from));
      const to = f && nodeIds.get(String(f.to));
      if (!from || !to) { skipped++; return; }
      insEdge.run(idFor('edge'), projectId, from, to, text(f.label, 200) || 'data', text(f.payload, 500), text(f.auth, 100) || 'None');
      flowTarget.set(String(f.id), to);
    });

    const insThreat = db.prepare(`INSERT INTO threats
      (id, node_id, stride, severity, description, control, mitigation) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    m.threats.forEach((t) => {
      const nodeId = t && (nodeIds.get(String(t.element)) || flowTarget.get(String(t.element)));
      if (!nodeId || !STRIDE.includes(t.stride)) { skipped++; return; }
      insThreat.run(idFor('thr'), nodeId, t.stride,
        SEV_IN[String(t.sev).toLowerCase()] || 'Medium',
        text(t.title ?? t.description) || 'Untitled threat',
        text(t.control),
        STATUS_IN[String(t.status).toLowerCase()] || 'Open');
    });
  });
  tx();

  return { project: db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId), skipped };
}
