export default function Settings({ state, setState }) {
  return (
    <>
      <h2>Settings</h2>

      <div className="section">
        <h3>Google OAuth (Phase 2)</h3>
        <p className="muted">Add credentials in Netlify → Site settings → Environment variables. Do not paste them here.</p>
        <pre className="log">
{`GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://YOUR-SITE.netlify.app/.netlify/functions/auth-google
SCOPES=https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.readonly`}
        </pre>
      </div>

      <div className="section">
        <h3>Send Options</h3>
        <label>
          <input
            type="checkbox"
            checked={state.connections.attachmentRequired}
            onChange={e => setState(s => ({
              ...s,
              connections: { ...s.connections, attachmentRequired: e.target.checked }
            }))}
          /> Require attachment before sending
        </label>
      </div>

      <div className="section">
        <h3>Reset</h3>
        <button
          className="btn secondary"
          onClick={() => { localStorage.clear(); location.reload(); }}
        >
          Clear local storage
        </button>
      </div>
    </>
  );
}
