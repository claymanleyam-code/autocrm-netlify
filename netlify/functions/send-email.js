// netlify/functions/send-email.js
// Sends one email via Gmail API using a stored refresh_token, then updates the sheet status.
// On success the status column transitions to 'First Email Sent' (matches the Sheets dropdown option).
// Body: {
//   refresh_token, from_email, to, subject, body,
//   sheet_url, sheet_title, status_col_letter, last_sent_col_letter, error_col_letter, row_number,
// }

const { getAccessToken, parseSheetId, json } = require('./_google');

const SENT_STATUS = 'First Email Sent';
const ERROR_STATUS = 'Error';

function b64url(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildRfc822({ from, to, subject, body }) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body || '',
  ];
  return lines.join('\r\n');
}

async function updateCell(access_token, sheetId, range, value) {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/` +
    encodeURIComponent(range) +
    '?valueInputOption=USER_ENTERED';
  return fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [[String(value ?? '')]] }),
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  const {
    refresh_token,
    from_email,
    to,
    subject,
    body: emailBody,
    sheet_url,
    sheet_title,
    status_col_letter,
    last_sent_col_letter,
    error_col_letter,
    row_number,
  } = body;

  if (!refresh_token) return json(400, { error: 'missing refresh_token' });
  if (!to) return json(400, { error: 'missing to' });
  if (!subject) return json(400, { error: 'missing subject' });

  let access_token;
  try { access_token = await getAccessToken(refresh_token); }
  catch (e) { return json(401, { error: 'auth: ' + e.message }); }

  const raw = b64url(buildRfc822({
    from: from_email || 'me',
    to,
    subject,
    body: emailBody || '',
  }));

  const sendRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );
  const sendJson = await sendRes.json();

  const sheetId = parseSheetId(sheet_url || '');
  const tab = sheet_title || 'Sheet1';
  const tabA1 = (col, row) => `${tab}!${col}${row}`;

  if (!sendRes.ok) {
    const errMsg = sendJson.error?.message || 'send_failed';
    if (sheetId && row_number && error_col_letter) {
      try { await updateCell(access_token, sheetId, tabA1(error_col_letter, row_number), errMsg); } catch (_) {}
    }
    if (sheetId && row_number && status_col_letter) {
      try { await updateCell(access_token, sheetId, tabA1(status_col_letter, row_number), ERROR_STATUS); } catch (_) {}
    }
    return json(sendRes.status, { error: errMsg });
  }

  const now = new Date().toISOString();
  if (sheetId && row_number) {
    try {
      if (status_col_letter) await updateCell(access_token, sheetId, tabA1(status_col_letter, row_number), SENT_STATUS);
      if (last_sent_col_letter) await updateCell(access_token, sheetId, tabA1(last_sent_col_letter, row_number), now);
      if (error_col_letter) await updateCell(access_token, sheetId, tabA1(error_col_letter, row_number), '');
    } catch (_) {}
  }

  return json(200, { ok: true, gmail_id: sendJson.id, sent_at: now, status: SENT_STATUS });
};
