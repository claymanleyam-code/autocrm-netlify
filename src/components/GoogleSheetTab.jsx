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
      connections: { ...s.connections, sheet: true }
    }));
  }
  function disconnect() {
    setState(s => ({
      ...s,
      sheetUrl: '', sheetId: null,
      connections: { ...s.connections, sheet: false }
    }));
  }

  return (
    <>
      <h2>Google Sheet</h2>
      <p className="muted">Paste your Google Sheet link. Live API calls will be wired up in Phase 2.</p>
      <div className="section">
        <input className="input" placeholder="https://docs.google.com/spreadsheets/d/..." value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <div className="section">
        <label className="muted">Tab name </label>
        <input className="input" style={{ maxWidth: 240 }} value={tab} onChange={e => setTab(e.target.value)} />
      </div>
      <button className="btn" onClick={connect}>Connect</button>
      <button className="btn secondary" onClick={disconnect}>Disconnect</button>

      {state.sheetId && (
        <div className="section" style={{ marginTop: 16 }}>
          <div><b>Sheet ID:</b> {state.sheetId}</div>
          <div><b>Tab:</b> {state.sheetTab}</div>
          <h3 style={{ marginTop: 12 }}>Column Mapping (mock data)</h3>
          {Object.entries(state.headerMap).map(([k, v]) => (
            <div key={k}>{k} → <b>{v?.header || '(missing)'}</b></div>
          ))}
          {state.missing.length > 0 && <div className="error">Missing: {state.missing.join(', ')}</div>}
        </div>
      )}
    </>
  );
}
