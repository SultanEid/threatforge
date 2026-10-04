import React, { useState } from 'react';
import { api } from '../api/client.js';
import { Button, Field, Notice } from '../components/ui.jsx';
import { Wordmark } from '../components/TopBar.jsx';

const EMPTY = { name: '', affiliation: '', email: '', password: '' };

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const switchTo = (m) => { setMode(m); setError(''); setForm((f) => ({ ...EMPTY, email: f.email })); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = mode === 'signin'
        ? await api.login(form.email, form.password)
        : await api.signup(form);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth grid-bg">
      <div className="auth__card">
        <div className="auth__brand">
          <img src="/glyph.svg" alt="" />
          <Wordmark />
        </div>
        <div className="auth__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={`auth__tab ${mode === 'signin' ? 'is-active' : ''}`} onClick={() => switchTo('signin')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={`auth__tab ${mode === 'signup' ? 'is-active' : ''}`} onClick={() => switchTo('signup')}>Create account</button>
        </div>
        <h2>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h2>
        <p className="auth__lede">
          {mode === 'signin' ? 'Your threat models are saved to your account.' : 'Models you create or upload are saved to this account.'}
        </p>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <Field label="Full name">
              <input className="input" value={form.name} onChange={set('name')} autoComplete="name" required />
            </Field>
          )}
          {mode === 'signup' && (
            <Field label="Affiliation">
              <input className="input" value={form.affiliation} onChange={set('affiliation')} placeholder="Research group or university" autoComplete="organization" />
            </Field>
          )}
          <Field label="Email">
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@university.edu" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
          </Field>
          <Notice notice={error && { kind: 'err', text: error }} />
          <Button variant="primary" block type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
