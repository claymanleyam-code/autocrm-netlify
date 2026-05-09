// netlify/functions/auth-google.js
// Google OAuth handler: redirects to consent, exchanges code, returns refresh_token to client.

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

exports.handler = async function (event) {
    const params = event.queryStringParameters || {};
    const { code, error } = params;

    if (error) {
          return redirect(`/?auth_error=${encodeURIComponent(error)}`);
    }

    // Step 1: no code -> kick off consent
    if (!code) {
          const url =
                  'https://accounts.google.com/o/oauth2/v2/auth?' +
                  new URLSearchParams({
                            client_id: CLIENT_ID,
                            redirect_uri: REDIRECT_URI,
                            response_type: 'code',
                            scope: SCOPES,
                            access_type: 'offline',
                            prompt: 'consent',
                            include_granted_scopes: 'true',
                  }).toString();
          return redirect(url);
    }

    // Step 2: exchange code for tokens
    try {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                            code,
                            client_id: CLIENT_ID,
                            client_secret: CLIENT_SECRET,
                            redirect_uri: REDIRECT_URI,
                            grant_type: 'authorization_code',
                  }).toString(),
          });
          const tokens = await tokenRes.json();
          if (!tokenRes.ok) {
                  return redirect(
                            `/?auth_error=${encodeURIComponent(
                                        tokens.error_description || tokens.error || 'token_exchange_failed'
                                      )}`
                          );
          }

      // Try to fetch the user's email so we can show "Connected as ..."
      let email = '';
          try {
                  const uiRes = await fetch(
                            'https://www.googleapis.com/oauth2/v2/userinfo',
                    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
                          );
                  if (uiRes.ok) {
                            const ui = await uiRes.json();
                            email = ui.email || '';
                  }
          } catch (_) {}

      // Hand the refresh_token back to the SPA via URL fragment so it lands in localStorage,
      // not in any server log or referrer.
      const frag = new URLSearchParams({
              refresh_token: tokens.refresh_token || '',
              access_token: tokens.access_token || '',
              expires_in: String(tokens.expires_in || 3600),
              email,
      }).toString();
          return redirect(`/#gmail_connected&${frag}`);
    } catch (e) {
          return redirect(`/?auth_error=${encodeURIComponent(e.message || 'unknown')}`);
    }
};

function redirect(Location) {
    return { statusCode: 302, headers: { Location }, body: '' };
}
