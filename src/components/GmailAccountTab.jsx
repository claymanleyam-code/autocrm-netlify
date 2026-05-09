import React from 'react';

export default function GmailAccountTab({ ctx }) {
  const { gmailConnected, gmailEmail, setRefreshToken, setGmailEmail } = ctx;

  const connect = () => { window.location.href = '/.netlify/functions/auth-google'; };
  const disconnect = () => { setRefreshToken(''); setGmailEmail(''); };

  return (
    <div>
      <div className="page-title">Gmail Account</div>
      {gmailConnected ? (
        <>
          <p style={{ color: '#070' }}>✓ Connected{gmailEmail ? ` as ${gmailEmail}` : ''}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <>
          <p>Click below to connect your Gmail account. This grants permission to send emails on your behalf and to read/write the Google Sheet you connect.</p>
          <button onClick={connect}>Connect Gmail with Google</button>
        </>
      )}
    </div>
  );
}
