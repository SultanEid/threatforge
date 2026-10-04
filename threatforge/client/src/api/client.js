// Thin fetch wrapper that talks to the ThreatForge API.
// In dev, Vite proxies /api → http://localhost:4000, so the session cookie is
// same-origin. A 401 from any call (other than the auth endpoints themselves)
// notifies the registered handler so the app can return to the sign-in screen.

const BASE = '/api';
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function http(method, path, body) {
  const opts = { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
    const message = (data && data.error) || res.statusText || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function download(path, fallbackName) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'same-origin' });
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    throw new Error('Download failed');
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = {
  // auth
  me:             ()                       => http('GET',    `/auth/me`),
  login:          (email, password)        => http('POST',   `/auth/login`, { email, password }),
  signup:         (data)                   => http('POST',   `/auth/signup`, data),
  logout:         ()                       => http('POST',   `/auth/logout`),
  updateProfile:  (patch)                  => http('PUT',    `/auth/me`, patch),

  // projects
  listProjects:   ()                       => http('GET',    `/projects`),
  attention:      ()                       => http('GET',    `/projects/attention`),
  createProject:  (data)                   => http('POST',   `/projects`, data),
  importProject:  (model)                  => http('POST',   `/projects/import`, model),
  getProject:     (id)                     => http('GET',    `/projects/${id}`),
  updateProject:  (id, patch)              => http('PUT',    `/projects/${id}`, patch),
  deleteProject:  (id)                     => http('DELETE', `/projects/${id}`),
  exportProject:  (id, name)               => download(`/projects/${id}/export`, `${name}.stm.json`),
  downloadReport: (id, name)               => download(`/projects/${id}/report`, `${name}_report.md`),
  getReport:      (id)                     =>
    fetch(`${BASE}/projects/${id}/report`, { credentials: 'same-origin' }).then((r) => {
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
