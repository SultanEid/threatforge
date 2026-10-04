import React, { useRef, useState } from 'react';
import { ArrowUpRight, Download, FileJson, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../api/client.js';
import { Avatar, Button, Card, Field, IconButton, Label, Notice, PageHeader, parseTs, timeAgo } from '../components/ui.jsx';

const COLS = 'minmax(0,1.6fr) 70px 70px 90px 96px';
const MAX_UPLOAD = 1024 * 1024;

export default function ProfileScreen({ user, projects, onOpen, onUser, onProjectsChanged }) {
  const [name, setName] = useState(user.name);
  const [affiliation, setAffiliation] = useState(user.affiliation || '');
  const [notice, setNotice] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef(null);
  const flash = (kind, text) => setNotice({ kind, text });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      onUser(await api.updateProfile({ name, affiliation }));
      flash('ok', 'Profile saved.');
    } catch (err) { flash('err', err.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    const n = newName.trim();
    if (!n) return flash('err', 'Model name is required.');
    try {
      const p = await api.createProject({ name: n, description: '' });
      setCreating(false);
      setNewName('');
      await onProjectsChanged();
      flash('ok', `Created ${p.name}.`);
    } catch (err) { flash('err', err.message); }
  };

  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const file of files) {
      try {
        if (file.size > MAX_UPLOAD) throw new Error('file is larger than 1 MB.');
        let data;
        try { data = JSON.parse(await file.text()); } catch { throw new Error('file is not valid JSON.'); }
        const { project, skipped } = await api.importProject(data);
        flash('ok', `Imported ${file.name} as ${project.name}${skipped ? ` (${skipped} invalid item${skipped === 1 ? '' : 's'} skipped)` : ''}.`);
      } catch (err) {
        flash('err', `Could not import ${file.name}: ${err.message}`);
      }
    }
    await onProjectsChanged();
  };

  const remove = async (p) => {
    try {
      await api.deleteProject(p.id);
      setConfirm(null);
      await onProjectsChanged();
      flash('ok', `Deleted ${p.name}.`);
    } catch (err) { flash('err', err.message); }
  };

  const exportOne = (p) => api.exportProject(p.id, p.name).catch((err) => flash('err', err.message));

  const totals = projects.reduce((a, p) => ({ els: a.els + p.node_count, threats: a.threats + p.stats.total }), { els: 0, threats: 0 });
  const since = parseTs(user.created_at);

  return (
    <>
      <PageHeader
        title="Profile & model files"
        subtitle={`${projects.length} model${projects.length === 1 ? '' : 's'} saved to ${user.email}`}
        actions={<>
          <input ref={fileRef} type="file" accept=".json,application/json" multiple onChange={upload} style={{ display: 'none' }} />
          <Button variant="secondary" icon={Upload} onClick={() => fileRef.current.click()}>Upload model file</Button>
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>New threat model</Button>
        </>}
      />
      <div className="page-body" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', alignItems: 'start' }}>
        <Card style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={user.name} large />
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '600 16px var(--font-sans)', color: 'var(--fg-1)' }}>{user.name}</div>
              <div className="cell-dim" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              {since && <div style={{ font: '400 12px var(--font-sans)', color: 'var(--fg-4)', marginTop: 2 }}>Member since {new Date(since).toISOString().slice(0, 10)}</div>}
            </div>
          </div>
          <form onSubmit={saveProfile} style={{ display: 'grid', gap: 12, paddingTop: 18, borderTop: '1px solid var(--line-1)' }}>
            <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Affiliation"><input className="input" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="Research group or university" /></Field>
            <div><Button variant="secondary" size="sm" type="submit">Save profile</Button></div>
          </form>
          <div style={{ paddingTop: 18, borderTop: '1px solid var(--line-1)', display: 'grid', gap: 6 }}>
            <Label>Workspace</Label>
            <div className="cell-dim">{projects.length} model{projects.length === 1 ? '' : 's'} · {totals.els} elements · {totals.threats} threats</div>
            <div style={{ font: '400 11px var(--font-mono)', color: 'var(--fg-4)' }}>Stored on the ThreatForge server</div>
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 12, gridColumn: 'span 2', minWidth: 0 }}>
          <Notice notice={notice} onClose={() => setNotice(null)} />
          {creating && (
            <form onSubmit={create} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--accent-line)', borderRadius: 4, padding: 12 }}>
              <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="model name, e.g. lab-booking-api" autoFocus style={{ flex: 1 }} />
              <Button variant="primary" size="sm" type="submit">Create</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => { setCreating(false); setNewName(''); }}>Cancel</Button>
            </form>
          )}
          <Card flush className="tbl">
            <div style={{ minWidth: 560 }}>
              <div className="tbl__head" style={{ gridTemplateColumns: COLS }}>
                {['Model file', 'Elements', 'Threats', 'Updated', ''].map((h) => <Label key={h}>{h}</Label>)}
              </div>
              {projects.length === 0 && (
                <p style={{ margin: 0, padding: 18, font: '400 13px var(--font-sans)', color: 'var(--fg-3)' }}>
                  No model files yet. Create a model or upload a .stm.json file.
                </p>
              )}
              {projects.map((p) => confirm === p.id ? (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--line-1)', background: 'var(--critical-bg)', flexWrap: 'wrap' }}>
                  <span style={{ flex: 1, minWidth: 240, font: '500 12px var(--font-sans)', color: 'var(--fg-1)' }}>
                    Deleting <span className="mono">{p.name}</span> will remove {p.stats.total} documented threats. This cannot be undone.
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>Cancel</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p)}>Delete model</Button>
                </div>
              ) : (
                <div key={p.id} className="tbl__row tbl__row--click" style={{ gridTemplateColumns: COLS, padding: '10px 18px' }} onClick={() => onOpen(p.id)}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                    <FileJson size={16} color="var(--fg-3)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="cell-title">{p.name}<span className="mono" style={{ color: 'var(--fg-4)', fontSize: 11 }}>.stm.json</span></div>
                      <div className="cell-sub">{p.id}</div>
                    </div>
                  </div>
                  <span className="cell-mono">{p.node_count}</span>
                  <span className="cell-mono">{p.stats.total}</span>
                  <span className="cell-dim">{timeAgo(p.updated_at)}</span>
                  <span style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <IconButton icon={ArrowUpRight} title="Open model" onClick={() => onOpen(p.id)} />
                    <IconButton icon={Download} title="Download .stm.json" onClick={() => exportOne(p)} />
                    <IconButton icon={Trash2} title="Delete model" danger onClick={() => setConfirm(p.id)} />
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <p style={{ margin: 0, font: '400 11px var(--font-mono)', color: 'var(--fg-4)' }}>
            Model files are JSON (.stm.json). Download to share or back up; upload to restore or to bring in models from the SERG prototype.
          </p>
        </div>
      </div>
    </>
  );
}
