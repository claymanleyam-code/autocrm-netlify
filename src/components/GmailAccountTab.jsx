export default function GmailAccountTab({ state, setState }) {
  function connect() {
    const email = prompt('Phase 1 placeholder — enter the Gmail address you will connect later:');
    if (!email) return;
    setState(s => ({
      ...s,
      gmailAccount: email,
      connections: { ...s.connections, gmail: true }
    }));
  }
  function disconnect() {
    setState(s => ({
      ...s,
      gmailAccount: '',
      connections: { ...s.connections, gmail: false }
    }));
  }
  function testEmail() {
    alert('Test email simulation — actual Gmail send wires up in Phase 2.');
  }

  return (
    <>
      <h2>Gmail Account</h2>
      {!state.connections.gmail && (
        <p className="warn">Please connect your Gmail account before sending emails.</p>
      )}
      <p className="muted">Phase 1 uses a placeholder. Real Google OAuth + Gmail API will plug in here in Phase 2.</p>
      <div className="section">
        <b>Connected:</b> {state.gmailAccount || '(none)'}
      </div>
      <button className="btn" onClick={connect}>Connect Gmail (placeholder)</button>
      <button className="btn secondary" onClick={disconnect}>Disconnect</button>
      <button className="btn secondary" onClick={testEmail}>Send Test Email</button>
    </>
  );
}
