// netlify/functions/_google.js
// Shared helpers for Google API calls (CommonJS so each function can require it).

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function getAccessToken(refresh_token) {
    const r = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
                  client_id: CLIENT_ID,
                  client_secret: CLIENT_SECRET,
                  grant_type: 'refresh_token',
                  refresh_token,
          }).toString(),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || j.error || 'refresh_failed');
    return j.access_token;
}

function parseSheetId(input) {
    if (!input) return null;
    const m = String(input).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9-_]{20,}$/.test(input)) return input;
    return null;
}

function parseGid(input) {
    if (!input) return 0;
    const m = String(input).match(/[#&?]gid=(\d+)/);
    return m ? Number(m[1]) : 0;
}

function json(statusCode, body) {
    return {
          statusCode,
          headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify(body),
    };
}

function colLetter(idx) {
    // 0 -> A, 25 -> Z, 26 -> AA
  let s = '';
    let n = idx;
    while (n >= 0) {
          s = String.fromCharCode((n % 26) + 65) + s;
          n = Math.floor(n / 26) - 1;
    }
    return s;
}

// Detects the index of common columns from a header row.
// Returns { firstName, email, company, status, lastSent, error } where each is a 0-based index or -1.
function detectColumns(headerRow) {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const find = (...needles) => {
          for (let i = 0; i < headerRow.length; i++) {
                  const h = norm(headerRow[i]);
                  if (needles.some((n) => h === n || h.includes(n))) return i;
          }
          return -1;
    };
    return {
          firstName: find('firstname', 'fname', 'name'),
          email: find('email', 'mail'),
          company: find('company', 'org', 'organization'),
          status: find('status', 'state'),
          lastSent: find('lastsent', 'lastemailsent', 'sentat'),
          error: find('error', 'errors'),
    };
}

module.exports = {
    getAccessToken,
    parseSheetId,
    parseGid,
    json,
    colLetter,
    detectColumns,
};
