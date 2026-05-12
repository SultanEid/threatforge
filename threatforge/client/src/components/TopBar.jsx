import React, { useState } from 'react';

export default function TopBar({
  syncState,
  projects,
  currentProject,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  onExportReport,
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onNewProject(name);
    setNewName('');
    setCreating(false);
  };

  const handleRename = (e) => {
    const v = e.target.value;
    if (currentProject && v && v !== currentProject.name) onRenameProject(v);
  };

  const handleDelete = () => {
    if (!currentProject) return;
    if (!confirm(`Delete project "${currentProject.name}"? This cannot be undone.`)) return;
    onDeleteProject(currentProject.id);
  };

  const status =
    syncState === 'syncing' ? 'Syncing'
    : syncState === 'error' ? 'Offline'
    : 'Synced';

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <span>THREATFORGE</span>
        <span className="brand-meta">v1.0 · STRIDE</span>
      </div>

      <div className="project-select">
        <select
          value={currentProject?.id || ''}
          onChange={(e) => onSelectProject(e.target.value)}
        >
          {projects.length === 0 && <option value="">No projects yet</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {currentProject && (
        <input
          key={currentProject.id}
          defaultValue={currentProject.name}
          onBlur={handleRename}
          style={{ width: 220, background: 'var(--bg-base)' }}
        />
      )}

      <div className="topbar-spacer" />

      <div className="topbar-status">
        <span className={`pulse ${syncState === 'syncing' ? 'is-syncing' : ''} ${syncState === 'error' ? 'is-error' : ''}`} />
        <span>{status}</span>
      </div>

      {creating ? (
        <>
          <input
            value={newName}
            placeholder="Project name…"
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
            style={{ width: 180 }}
          />
          <button onClick={handleCreate}>Create</button>
          <button className="ghost" onClick={() => setCreating(false)}>Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setCreating(true)}>+ New Project</button>
          <button onClick={handleDelete} disabled={!currentProject}>Delete</button>
          <button className="primary" onClick={onExportReport} disabled={!currentProject}>Export Report</button>
        </>
      )}
    </div>
  );
}
