import { useState } from 'react';
import { parseSheetId } from '../utils/linkParser.js';
import { mapHeaders } from '../utils/sheetMapping.js';

export default function GoogleSheetTab({ state, setState }) {
  const [url, setUrl] = useState(state.sheetUrl || '');
  const [tab, setTab] = useState(state.sheetTab || 'Sheet1');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function importLeads() {
    setErr('');
    const id = parseSheetId(url);
    if (!id) { setErr('Invalid Google Sheet link'); return; }
    if (!state.gmailRefreshToken) { setErr('Connect Gmail first — we use the same Google account to read the sheet.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/sheets-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: state.gmailRefreshToken, sheet_url: url }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error || ('http ' + res.status)); setLoading(false); return; }
      const headers = j.headers || [];
      const cells = (j.rows || []).map(r => r.cells || []);
      const { map, missing } = mapHeaders(headers);
      const sheetTitle = j.sheetTitle || tab || 'Sheet1';
      setTab(sheetTitle);
      setState(s => ({
        ...s,
        sheetUrl: url,
        sheetId: id,
        sheetTab: sheetTitle,
        headerRow: headers,
        headerMap: map,
        missing,
        rows: cells,
        connections: { ...s.connections, sheet: missing.length === 0 },
      }));
    } catch (e) {
      setErr(e.message || 'request_failed');
    }
    setLoading(false);
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
          Connected to {state.sheetTab}. Imported {state.rows.length} lead{state.rows.length === 1 ? '' : 's'}.
        </div>
      )}

      {!!err && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>{err}</div>
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
          <button className="btn btn-primary" onClick={importLeads} disabled={loading}>
            {loading ? 'Importing…' : 'Import Leads'}
          </button>
          {state.connections.sheet && (
            <button className="btn btn-secondary" onClick={disconnect}>Disconnect</button>
          )}
        </div>

        <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          Reads the sheet via Google Sheets API using the OAuth token from the connected Gmail account.
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
