import React from 'react';
import { LogOut } from 'lucide-react';
import { Avatar, Button } from './ui.jsx';

export const Wordmark = () => <span className="wordmark">threatforge</span>;

export default function TopBar({ user, project, syncState, onHome, onProfile, onSignOut }) {
  const sync = syncState === 'syncing' ? 'Saving…' : syncState === 'error' ? 'Offline' : 'Saved';
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} title="All models">
        <img src="/glyph.svg" alt="" />
        <Wordmark />
      </button>
      {project && <span className="topbar__sep">/</span>}
      {project && <span className="topbar__crumb">{project.name}</span>}
      <div className="topbar__spacer" />
      {project && (
        <span className={`topbar__sync ${syncState === 'syncing' ? 'is-syncing' : ''} ${syncState === 'error' ? 'is-error' : ''}`}>{sync}</span>
      )}
      <button className="user-btn" onClick={onProfile} title="Profile & model files">
        <Avatar name={user.name} />
        {user.name}
      </button>
      <Button variant="ghost" size="sm" icon={LogOut} onClick={onSignOut}>Sign out</Button>
    </header>
  );
}
