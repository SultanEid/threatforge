import React from 'react';
import { LayoutGrid, FolderOpen, LayoutDashboard, Workflow, ListChecks, Boxes, FileText } from 'lucide-react';
import { Label, timeAgo } from './ui.jsx';

function SideGroup({ title, items, view, setView }) {
  return (
    <div className="side-group">
      <Label>{title}</Label>
      {items.map(({ id, icon: Icon, label, count }) => (
        <button key={id} className={`side-item ${view === id ? 'is-active' : ''}`} onClick={() => setView(id)}>
          <Icon size={15} />
          <span className="side-item__label">{label}</span>
          {count != null && <span className="side-item__count">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export default function Sidebar({ view, setView, project, projectCount, stats }) {
  const account = [
    { id: 'overview', icon: LayoutGrid, label: 'All models', count: projectCount },
    { id: 'profile', icon: FolderOpen, label: 'Profile & files' },
  ];
  const model = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'diagram', icon: Workflow, label: 'Diagram' },
    { id: 'threats', icon: ListChecks, label: 'Threats', count: stats?.threats },
    { id: 'assets', icon: Boxes, label: 'Assets', count: stats?.elements },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ];
  return (
    <nav className="sidebar">
      <SideGroup title="Account" items={account} view={view} setView={setView} />
      {project && <SideGroup title={`Model · ${project.name}`} items={model} view={view} setView={setView} />}
      {project && stats && (
        <div className="side-foot">
          <div className="side-foot__title">› model</div>
          <div>{stats.threats} threats · {stats.elements} elements</div>
          <div className="side-foot__dim">updated {timeAgo(project.updated_at)}</div>
        </div>
      )}
    </nav>
  );
}
