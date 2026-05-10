export default function Settings({ state, setState }) {
  const attachmentRequired = state.connections.attachmentRequired;

  function toggleAttachment(e) {
    setState(s => ({
      ...s,
      connections: { ...s.connections, attachmentRequired: e.target.checked },
    }));
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configuration and preferences</p>
      </div>

      <div className="panel">
        <div className="panel-title">Send Options</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Require attachment before sending</div>
            <div className="settings-row-desc">Block the Send action if no attachment is connected</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={attachmentRequired} onChange={toggleAttachment} />
            <span className="toggle-track" />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Google OAuth — Phase 2</div>
        <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>
          Add credentials in Netlify → Site settings → Environment variables. Never paste secrets here.
        </p>
        <div className="log" style={{ fontSize: 11, maxHeight: 160 }}>{`GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://YOUR-SITE.netlify.app/.netlify/functions/auth-google
SCOPES=https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.readonly`}</div>
      </div>

      <div className="panel">
        <div className="panel-title">Data</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Clear all local data</div>
            <div className="settings-row-desc">Resets the app to its default state</div>
          </div>
          <button
            className="btn btn-destructive"
            onClick={() => { if (confirm('Clear all local data and reload?')) { localStorage.clear(); location.reload(); } }}
          >
            Clear Data
          </button>
        </div>
      </div>
    </>
  );
}
