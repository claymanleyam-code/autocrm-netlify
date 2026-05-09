// netlify/functions/sheets-update.js
// Updates a single cell in a Google Sheet.
// Body: { refresh_token, sheet_url, range, value }
//   range: A1 notation including sheet title, e.g. "Sheet1!D3"

const { getAccessToken, parseSheetId, json } = require('./_google');

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return json(200, {});
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) {}
    const { refresh_token, sheet_url, range, value } = body;
    if (!refresh_token) return json(400, { error: 'missing refresh_token' });
    if (!sheet_url) return json(400, { error: 'missing sheet_url' });
    if (!range) return json(400, { error: 'missing range' });

    const sheetId = parseSheetId(sheet_url);
    if (!sheetId) return json(400, { error: 'invalid sheet url' });

    let access_token;
    try { access_token = await getAccessToken(refresh_token); }
    catch (e) { return json(401, { error: 'auth: ' + e.message }); }

    const url =
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/` +
          encodeURIComponent(range) +
          '?valueInputOption=USER_ENTERED';

    const r = await fetch(url, {
          method: 'PUT',
          headers: {
                  Authorization: `Bearer ${access_token}`,
                  'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [[String(value ?? '')]] }),
    });
    const j = await r.json();
    if (!r.ok) return json(r.status, { error: j.error?.message || 'update_failed' });
    return json(200, { ok: true, updated: j.updatedRange });
};
