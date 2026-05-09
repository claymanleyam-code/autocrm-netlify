import React, { useEffect, useState, useMemo } from 'react';

function colLetter(idx) {
  let s = ''; let n = idx;
  while (n >= 0) { s = String.fromCharCode((n % 26) + 65) + s; n = Math.floor(n / 26) - 1; }
  return s;
}

function applyTemplate(tpl, row) {
  return String(tpl || '')
    .replaceAll('{{first_name}}', row.firstName || '')
    .replaceAll('{{email}}', row.email || '')
    .replaceAll('{{company}}', row.company || '');
}

export default function Dashboard({ ctx }) {
  const { refreshToken, sheetUrl, gmailEmail, tmplSubject, tmplBody, gmailConnected, sheetConnected } = ctx;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null); // { sheetTitle, headers, mapping, rows }
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const canSend = gmailConnected && sheetConnected && data && data.mapping && data.mapping.email >= 0;

  const refresh = async () => {
    if (!gmailConnected || !sheetConnected) return;
    setLoading(true); setError(''); 
    try {
      const r = await fetch('/.netlify/functions/sheets-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken, sheet_url: sheetUrl }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      setData(j);
      setSelected(new Set());
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [refreshToken, sheetUrl]);

  const toggle = (rn) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(rn)) n.delete(rn); else n.add(rn);
      return n;
    });
  };
  const toggleAll = () => {
    if (!data) return;
    setSelected((s) => {
      if (s.size === data.rows.length) return new Set();
      return new Set(data.rows.map((r) => r.rowNumber));
    });
  };

  const sendOne = async (row) => {
    if (!canSend) return;
    if (!row.email) {
      setLog((l) => [{ ts: Date.now(), text: `Row ${row.rowNumber}: missing email, skipped` }, ...l]);
      return;
    }
    const m = data.mapping;
    const subject = applyTemplate(tmplSubject, row);
    const body = applyTemplate(tmplBody, row);
    const payload = {
      refresh_token: refreshToken,
      from_email: gmailEmail || 'me',
      to: row.email,
      subject, body,
      sheet_url: sheetUrl,
      sheet_title: data.sheetTitle,
      status_col_letter: m.status >= 0 ? colLetter(m.status) : '',
      last_sent_col_letter: m.lastSent >= 0 ? colLetter(m.lastSent) : '',
      error_col_letter: m.error >= 0 ? colLetter(m.error) : '',
      row_number: row.rowNumber,
    };
    const r = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) {
      setLog((l) => [{ ts: Date.now(), text: `Row ${row.rowNumber} (${row.email}): ERROR ${j.error || 'failed'}` }, ...l]);
      return false;
    }
    setLog((l) => [{ ts: Date.now(), text: `Row ${row.rowNumber} (${row.email}): sent ${j.gmail_id || ''}` }, ...l]);
    return true;
  };

  const sendSelected = async () => {
    if (!canSend || selected.size === 0) return;
    setBusy(true);
    const targets = data.rows.filter((r) => selected.has(r.rowNumber));
    for (const row of targets) {
      // eslint-disable-next-line no-await-in-loop
      await sendOne(row);
    }
    await refresh();
    setBusy(false);
  };

  const sendAll = async () => {
    if (!canSend) return;
    setBusy(true);
    for (const row of data.rows) {
      if (!row.email) continue;
      const cur = (row.status || '').toLowerCase();
      if (cur === 'sent') continue;
      // eslint-disable-next-line no-await-in-loop
      await sendOne(row);
    }
    await refresh();
    setBusy(false);
  };

  const m = data?.mapping;
  return (
    <div className="dashboard">
      <div className="page-title">Dashboard</div>
      <div className="status-row">
        <span className={'pill ' + (gmailConnected ? 'ok' : 'bad')}>Gmail: {gmailConnected ? gmailEmail || 'connected' : 'not connected'}</span>
        <span className={'pill ' + (sheetConnected ? 'ok' : 'bad')}>Sheet: {sheetConnected ? 'connected' : 'not connected'}</span>
      </div>

      {!gmailConnected && <p>Connect Gmail in the Gmail Account tab.</p>}
      {!sheetConnected && <p>Paste a Google Sheet URL in the Google Sheet tab.</p>}
      {error && <div className="banner banner-error">{error}</div>}
      {loading && <p>Loading sheet…</p>}

      {data && (
        <>
          <div className="mapping-card">
            <strong>Detected columns ({data.sheetTitle}):</strong>
            <ul>
              <li>First name: {m.firstName >= 0 ? `${data.headers[m.firstName]} (${colLetter(m.firstName)})` : 'not detected'}</li>
              <li>Email: {m.email >= 0 ? `${data.headers[m.email]} (${colLetter(m.email)})` : 'NOT FOUND – sending disabled'}</li>
              <li>Company: {m.company >= 0 ? `${data.headers[m.company]} (${colLetter(m.company)})` : 'not detected'}</li>
              <li>Status: {m.status >= 0 ? `${data.headers[m.status]} (${colLetter(m.status)})` : 'not detected (won\'t mark Sent)'}</li>
              <li>Last sent: {m.lastSent >= 0 ? `${data.headers[m.lastSent]} (${colLetter(m.lastSent)})` : 'not detected'}</li>
              <li>Error: {m.error >= 0 ? `${data.headers[m.error]} (${colLetter(m.error)})` : 'not detected'}</li>
            </ul>
          </div>

          <div className="action-bar">
            <button onClick={sendSelected} disabled={!canSend || selected.size === 0 || busy}>
              {busy ? 'Sending…' : `Send selected (${selected.size})`}
            </button>
            <button onClick={sendAll} disabled={!canSend || busy}>
              {busy ? 'Sending…' : 'Send all (skip Sent)'}
            </button>
            <button onClick={refresh} disabled={loading || busy}>Refresh from sheet</button>
          </div>

          <table className="rows-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={data.rows.length > 0 && selected.size === data.rows.length} onChange={toggleAll}/></th>
                <th>Row</th>
                <th>First name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Status</th>
                <th>Last sent</th>
                <th>Error</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.rowNumber}>
                  <td><input type="checkbox" checked={selected.has(row.rowNumber)} onChange={() => toggle(row.rowNumber)}/></td>
                  <td>{row.rowNumber}</td>
                  <td>{row.firstName}</td>
                  <td>{row.email}</td>
                  <td>{row.company}</td>
                  <td>{row.status}</td>
                  <td>{row.lastSent}</td>
                  <td>{row.error}</td>
                  <td><button disabled={!canSend || busy || !row.email} onClick={() => (async () => { setBusy(true); await sendOne(row); await refresh(); setBusy(false); })()}>Send</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          {log.length > 0 && (
            <div className="log">
              <strong>Activity</strong>
              <ul>{log.map((l) => <li key={l.ts}>{new Date(l.ts).toLocaleTimeString()} — {l.text}</li>)}</ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
