import { useEffect } from 'react';

export default function GmailAccountTab({ state, setState }) {

  // On mount: check if we just came back from Google OAuth
  useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const authError = params.get('auth_error');

                if (authError) {
                        alert('Google auth error: ' + authError);
                        window.history.replaceState({}, '', '/');
                        return;
                }

                if (accessToken) {
                        const tokenData = {
                                  access_token: accessToken,
                                  refresh_token: refreshToken || '',
                                  expires_in: parseInt(params.get('expires_in') || '3600'),
                                  token_type: params.get('token_type') || 'Bearer',
                                  obtained_at: Date.now()
                        };
                        localStorage.setItem('google_tokens', JSON.stringify(tokenData));
                        setState(s => ({
                                  ...s,
                                  gmailAccount: 'connected',
                                  connections: { ...s.connections, gmail: true }
                        }));
                        // Clean up URL
          window.history.replaceState({}, '', '/');
                }

                // Restore from localStorage if already connected
                const stored = localStorage.getItem('google_tokens');
        if (stored && !state.connections.gmail) {
                setState(s => ({
                          ...s,
                          gmailAccount: 'connected',
                          connections: { ...s.connections, gmail: true }
                }));
        }
  }, []);

  function connect() {
        window.location.href = '/.netlify/functions/auth-google';
  }

  function disconnect() {
        localStorage.removeItem('google_tokens');
        setState(s => ({
                ...s,
                gmailAccount: '',
                connections: { ...s.connections, gmail: false }
        }));
  }

  return (
        <>
              <h2>Gmail Account</h2>h2>
          {!state.connections.gmail && (
                  <div className="section">
                            <p>Connect your Gmail account to enable sending emails through AutoCRM.</p>p>
                            <button className="btn" onClick={connect}>Connect Gmail with Google</button>button>
                  </div>div>
              )}
          {state.connections.gmail && (
                  <div className="section">
                            <p style={{ color: 'var(--green)' }}>&#10003; Gmail connected</p>p>
                            <button className="btn btn-secondary" onClick={disconnect}>Disconnect</button>button>
                  </div>div>
              )}
        </>>
      );
}</>
