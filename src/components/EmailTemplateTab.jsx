import { useState } from 'react';
import { parseDocId } from '../utils/linkParser.js';

export default function EmailTemplateTab({ state, setState }) {
  const [url, setUrl] = useState(state.docUrl || '');
  const [text, setText] = useState(state.template || '');
  const [saved, setSaved] = useState(false);

  function connect() {
    const id = parseDocId(url);
    if (!id) return alert('Invalid Google Doc link');
    setState(s => ({
      ...s,
      docUrl: url,
      docId: id,
      connections: { ...s.connections, template: true },
    }));
  }

  function saveTemplate() {
    setState(s => ({ ...s, template: text }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Email Template</h1>
        <p className="page-subtitle">Write your outreach email with merge fields</p>
      </div>

      <div className="panel">
        <div className="panel-title">Google Doc Source <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--g3)' }}>(optional)</span></div>

        <div className="form-group">
          <label className="form-label">Google Doc URL</label>
          <input
            className="input"
            placeholder="https://docs.google.com/document/d/…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={connect}>Connect Doc</button>
          {state.docId && (
            <span style={{ fontSize: 13, color: 'var(--g2)' }}>
              Doc ID: <span className="mono">{state.docId}</span>
            </span>
          )}
        </div>

        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          Doc body will be fetched automatically in Phase 2.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-title">Template Body</div>

        <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>
          Use <span className="mono">{'{{first_name}}'}</span> and <span className="mono">{'{{company}}'}</span> as merge fields.
        </p>

        <textarea
          className="input"
          rows={12}
          style={{ maxWidth: '100%' }}
          value={text}
          onChange={e => { setText(e.target.value); setSaved(false); }}
        />

        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={saveTemplate}>
            {saved ? '✓ Saved' : 'Save Template'}
          </button>
        </div>
      </div>
    </>
  );
}
