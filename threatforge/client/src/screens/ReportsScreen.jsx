import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { api } from '../api/client.js';
import { Button, Notice, PageHeader } from '../components/ui.jsx';

export default function ReportsScreen({ project, onExportReport }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    api.getReport(project.id).then(setReport, (e) => setError(e.message));
  };
  useEffect(load, [project.id]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`${project.name} · Markdown threat register`}
        actions={<>
          <Button variant="ghost" icon={RefreshCw} onClick={load}>Regenerate</Button>
          <Button variant="primary" icon={Download} onClick={onExportReport}>Download .md</Button>
        </>}
      />
      <div className="page-body">
        <Notice notice={error && { kind: 'err', text: error }} />
        {report === null && !error && <p className="muted mono">Generating report…</p>}
        {report !== null && <pre className="report">{report}</pre>}
      </div>
    </>
  );
}
