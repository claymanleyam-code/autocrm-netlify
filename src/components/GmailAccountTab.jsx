export default function GmailAccountTab({ state, setState }) {
  function connect() {
    window.location.assign('/.netlify/functions/auth-google');
  }

  function disconnect() {
    setState(s => ({
      ...s,
      gmailAccount: '',
      gmailRefreshToken: '',
      gmailAccessToken: '',
      gmailAccessTokenExpiresAt: 0,
      connections: { ...s.connections, gmail: false },
    }));
  }

  function testEmail() {
    alert('Test email simulation — Gmail send will be wired up in Phase 2.');
  }

  const { gmailAccount, connections } = state;
  const initials = gmailAccount ? gmailAccount[0].toUpperCase() : '';

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Gmail Account</h1>
        <p className="page-subtitle">Connect the account that will send your emails</p>
      </div>

      {!connections.gmail && (
        <div className="alert alert-warn" style={{ marginBottom: 20 }}>
          No Gmail account connected. Sending is disabled until you connect one.
        </div>
      )}

      <div className="panel">
        <div className="panel-title">Connected Account</div>

        {connections.gmail ? (
          <div className="account-card" style={{ marginBottom: 16 }}>
            <div className="account-avatar">{initials}</div>
            <div className="account-info">
              <div className="account-email">{gmailAccount}</div>
              <div className="account-label">● Connected</div>
            </div>
          </div>
        ) : (
          <p className="muted" style={{ marginBottom: 16 }}>
            Click “Connect Gmail” to sign in with Google and authorize sending.
          </p>
        )}

        <div className="btn-row">
          {!connections.gmail && (
            <button className="btn btn-primary" onClick={connect}>Connect Gmail</button>
          )}
          {connections.gmail && (
            <>
              <button className="btn btn-secondary" onClick={testEmail}>Send Test Email</button>
              <button className="btn btn-destructive" onClick={disconnect}>Disconnect</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
