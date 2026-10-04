import React, { useState, useEffect, useCallback } from 'react';
import { TriangleAlert, Check } from 'lucide-react';

import { api, setUnauthorizedHandler } from './api/client.js';
import { useProject } from './hooks/useProject.js';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import AuthScreen from './screens/AuthScreen.jsx';
import OverviewScreen from './screens/OverviewScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import DiagramScreen from './screens/DiagramScreen.jsx';
import ThreatsScreen from './screens/ThreatsScreen.jsx';
import AssetsScreen from './screens/AssetsScreen.jsx';
import ReportsScreen from './screens/ReportsScreen.jsx';

const MODEL_VIEWS = ['dashboard', 'diagram', 'threats', 'assets', 'reports'];
const NAV_KEY = 'tf.nav';
const NO_SELECTION = { nodeId: null, edgeId: null };

function loadNav() {
  try { return JSON.parse(localStorage.getItem(NAV_KEY)) || { view: 'overview', projectId: null }; }
  catch { return { view: 'overview', projectId: null }; }
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking session
  const [projects, setProjects] = useState([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [attention, setAttention] = useState([]);
  const [nav, setNav] = useState(loadNav);
  const [selection, setSelection] = useState(NO_SELECTION);
  const [syncState, setSyncState] = useState('idle');
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, isError = false) => setToast({ message, isError }), []);
  const handleError = useCallback((e) => { console.error(e); notify(e.message || 'Request failed', true); }, [notify]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    try { localStorage.setItem(NAV_KEY, JSON.stringify(nav)); } catch { /* storage unavailable */ }
  }, [nav]);

  // -------------- SESSION --------------
  const signedOut = useCallback(() => {
    setUser(null);
    setProjects([]);
    setProjectsLoaded(false);
    setAttention([]);
    setSelection(NO_SELECTION);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signedOut);
    api.me().then(setUser, signedOut);
  }, [signedOut]);

  const refreshProjects = useCallback(async () => {
    try {
      const [list, att] = await Promise.all([api.listProjects(), api.attention()]);
      setProjects(list);
      setAttention(att);
    } catch (e) {
      if (e.status !== 401) handleError(e);
    } finally {
      setProjectsLoaded(true);
    }
  }, [handleError]);

  useEffect(() => { if (user) refreshProjects(); }, [user?.id, refreshProjects]); // eslint-disable-line react-hooks/exhaustive-deps

  // Account views show cross-model stats; refresh them whenever we land there.
  useEffect(() => {
    if (user && !MODEL_VIEWS.includes(nav.view)) refreshProjects();
  }, [nav.view]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------- ACTIVE MODEL --------------
  const project = projects.find((p) => p.id === nav.projectId) || null;
  const proj = useProject(project?.id ?? null, { onError: handleError, onSync: setSyncState });
  const view = MODEL_VIEWS.includes(nav.view) && !project ? 'overview' : nav.view;

  const setView = (v) => setNav((n) => ({ ...n, view: v }));
  const openProject = (projectId, nodeId = null) => {
    setNav({ view: nodeId ? 'diagram' : 'dashboard', projectId });
    setSelection({ nodeId, edgeId: null });
  };
  const selectNode = (nodeId) => {
    setSelection({ nodeId, edgeId: null });
    setView('diagram');
  };
  const exportReport = () => {
    if (!project) return;
    api.downloadReport(project.id, project.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase())
      .then(() => notify('Report exported'), handleError);
  };
  const signOut = async () => {
    try { await api.logout(); } catch { /* clearing local state is what matters */ }
    signedOut();
  };

  // -------------- RENDER --------------
  if (user === undefined) {
    return <div className="splash"><img src="/glyph.svg" alt="" />Loading…</div>;
  }
  if (user === null) {
    return <AuthScreen onAuthed={(u) => { setUser(u); setNav({ view: 'overview', projectId: null }); }} />;
  }

  let body;
  if (view === 'profile') {
    body = <ProfileScreen user={user} projects={projects} onOpen={openProject} onUser={setUser} onProjectsChanged={refreshProjects} />;
  } else if (!MODEL_VIEWS.includes(view)) {
    body = projectsLoaded
      ? <OverviewScreen user={user} projects={projects} attention={attention} onOpen={openProject} onFiles={() => setView('profile')} />
      : <div className="splash">Loading models…</div>;
  } else if (view === 'dashboard') {
    body = <DashboardScreen project={project} proj={proj} onNavigate={setView} onSelectNode={selectNode} onExportReport={exportReport} />;
  } else if (view === 'diagram') {
    body = <DiagramScreen project={project} proj={proj} selection={selection} setSelection={setSelection} notify={notify} />;
  } else if (view === 'threats') {
    body = <ThreatsScreen project={project} proj={proj} onSelectNode={selectNode} />;
  } else if (view === 'assets') {
    body = <AssetsScreen proj={proj} onNavigate={setView} onSelectNode={selectNode} />;
  } else {
    body = <ReportsScreen key={project.id} project={project} onExportReport={exportReport} />;
  }

  const inModel = MODEL_VIEWS.includes(view);
  return (
    <div className="app">
      <TopBar
        user={user}
        project={inModel ? project : null}
        syncState={syncState}
        onHome={() => setView('overview')}
        onProfile={() => setView('profile')}
        onSignOut={signOut}
      />
      <div className="app__main">
        <Sidebar
          view={view}
          setView={setView}
          project={project}
          projectCount={projects.length}
          stats={project ? { threats: proj.stats.threats, elements: proj.stats.elements } : null}
        />
        <main className="app__content">{body}</main>
      </div>
      {toast && (
        <div className={`toast ${toast.isError ? 'is-error' : ''}`} role="status">
          {toast.isError ? <TriangleAlert size={14} /> : <Check size={14} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
