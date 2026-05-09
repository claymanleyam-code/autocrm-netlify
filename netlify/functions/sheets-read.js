// netlify/functions/sheets-read.js
// Reads a Google Sheet, auto-detects columns, returns { headers, rows, mapping, sheetTitle }.
// Body: { refresh_token, sheet_url }

const { getAccessToken, parseSheetId, parseGid, json, detectColumns } = require('./_google');

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return json(200, {});
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) {}
    const { refresh_token, sheet_url } = body;
    if (!refresh_token) return json(400, { error: 'missing refresh_token' });
    if (!sheet_url) return json(400, { error: 'missing sheet_url' });

    const sheetId = parseSheetId(sheet_url);
    if (!sheetId) return json(400, { error: 'invalid sheet url' });
    const gid = parseGid(sheet_url);

    let access_token;
    try { access_token = await getAccessToken(refresh_token); }
    catch (e) { return json(401, { error: 'auth: ' + e.message }); }

    const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${access_token}` } }
        );
    const meta = await metaRes.json();
    if (!metaRes.ok) return json(metaRes.status, { error: meta.error?.message || 'meta_failed' });

    const sheets = meta.sheets || [];
    const target = sheets.find((s) => s.properties && s.properties.sheetId === gid) || sheets[0];
    const sheetTitle = target?.properties?.title || 'Sheet1';

    const range = encodeURIComponent(`${sheetTitle}`);
    const valRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
        );
    const val = await valRes.json();
    if (!valRes.ok) return json(valRes.status, { error: val.error?.message || 'values_failed' });

    const values = val.values || [];
    const headers = values[0] || [];
    const dataRows = values.slice(1);
    const mapping = detectColumns(headers);

    const rows = dataRows.map((r, i) => ({
          rowNumber: i + 2,
          cells: r,
          firstName: mapping.firstName >= 0 ? r[mapping.firstName] || '' : '',
          email: mapping.email >= 0 ? r[mapping.email] || '' : '',
          company: mapping.company >= 0 ? r[mapping.company] || '' : '',
          status: mapping.status >= 0 ? r[mapping.status] || '' : '',
          lastSent: mapping.lastSent >= 0 ? r[mapping.lastSent] || '' : '',
          error: mapping.error >= 0 ? r[mapping.error] || '' : '',
    }));

    return json(200, { sheetId, sheetTitle, headers, mapping, rows });
};
