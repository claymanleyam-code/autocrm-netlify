import { useState } from 'react';
import { parseSheetId } from '../utils/linkParser.js';

export default function GoogleSheetTab({ state, setState }) {
  const [url, setUrl] = useState(state.sheetUrl || '');
  const [tab, setTab] = useState(state.sheetTab || 'Sheet1');

  function connect() {
    const id = parseSheetId(url);
    if (!id) return alert('Invalid Google Sheet link');
    setState(s => ({
      ...s,
      sheetUrl: url,
      sheetId: id,
      sheetTab: tab,
      connections: { ...s.connections, sheet: true },
    }));
  }

  function disconnect() {
    setState(s => ({
      ...s,
      sheetUrl: '',
      sheetId: null,
      connections: { ...s.connections, sheet: false },
    }));
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Google Sheet</h1>
        <p className="page-subtitle">Connect your leads spreadsheet</p>
      </div>

      {state.connections.sheet && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          Sheet connected · ID: <span className="mono">{state.sheetId}</span>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">Sheet Source</div>

        <div className="form-group">
          <label className="form-label">Google Sheet URL</label>
          <input
            className="input"
            placeholder="https://docs.google.com/spreadsheets/d/…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tab name</label>
          <input
            className="input"
            style={{ maxWidth: 260 }}
            value={tab}
            onChange={e => setTab(e.target.value)}
          />
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={connect}>Connect Sheet</button>
          {state.connections.sheet && (
            <button className="btn btn-secondary" onClick={disconnect}>Disconnect</button>
          )}
        </div>

        <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          Live API reads will be wired up in Phase 2. Using mock data for now.
        </p>
      </div>

      {state.sheetId && (
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panel-title">Column Mapping</div>
          <div>
            {Object.entries(state.headerMap).map(([k, v]) => (
              <div key={k} className="kv-row">
                <span className="kv-key">{k}</span>
                <span className="kv-val">{v?.header || <span style={{ color: 'var(--red-text)' }}>missing</span>}</span>
              </div>
            ))}
          </div>
          {state.missing.length > 0 && (
            <div className="alert alert-error" style={{ marginTop: 14, marginBottom: 0 }}>
              Missing columns: {state.missing.join(', ')}
            </div>
          )}
        </div>
      )}
    </>
  );
}
