// Thin fetch wrapper that talks to the ThreatForge API.
// In dev, Vite proxies /api → http://localhost:4000

const BASE = '/api';

async function http(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = (data && data.error) || res.statusText || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // health
  health: () => http('GET', '/health'),

  // projects
  listProjects:   ()                       => http('GET',    `/projects`),
  createProject:  (data)                   => http('POST',   `/projects`, data),
  getProject:     (id)                     => http('GET',    `/projects/${id}`),
  updateProject:  (id, patch)              => http('PUT',    `/projects/${id}`, patch),
  deleteProject:  (id)                     => http('DELETE', `/projects/${id}`),
  getReport:      (id)                     =>
    fetch(`${BASE}/projects/${id}/report`).then((r) => {
      if (!r.ok) throw new Error('Report failed');
      return r.text();
    }),

  // nodes
  createNode:  (projectId, data)           => http('POST',   `/projects/${projectId}/nodes`, data),
  updateNode:  (id, patch)                 => http('PUT',    `/nodes/${id}`, patch),
  deleteNode:  (id)                        => http('DELETE', `/nodes/${id}`),

  // edges
  createEdge:  (projectId, data)           => http('POST',   `/projects/${projectId}/edges`, data),
  updateEdge:  (id, patch)                 => http('PUT',    `/edges/${id}`, patch),
  deleteEdge:  (id)                        => http('DELETE', `/edges/${id}`),

  // threats
  createThreat: (nodeId, data)             => http('POST',   `/nodes/${nodeId}/threats`, data),
  updateThreat: (id, patch)                => http('PUT',    `/threats/${id}`, patch),
  deleteThreat: (id)                       => http('DELETE', `/threats/${id}`),
};
