import { useMemo, useState } from 'react';
import LeadsTable from './LeadsTable.jsx';
import EmailPreview from './EmailPreview.jsx';
import { extractEmails } from '../utils/emailParser.js';
import { applyTemplate, buildSubject } from '../utils/templateCleaner.js';

const FIRST_EMAIL_SENT = 'First Email Sent';
const LAST_SENT_COL_INDEX = 4; // legacy: column E
const ERROR_COL_INDEX = 5;     // legacy: column F

function colLetter(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2L2 6.5l5 2L14 2zM9 8.5l3 5.5L14 2"/>
  </svg>
);

export default function Dashboard({ state, setState }) {
  const { rows, headerMap, template, connections } = state;
  const [selected, setSelected] = useState(new Set());
  const [log, setLog] = useState([]);
  const [sending, setSending] = useState(false);

  const ready = rows.filter(r =>
    (r[headerMap.status?.index] || '').toLowerCase() !== 'first email sent'
  ).length;

  const sentToday = rows.filter(r => {
    const last = r[LAST_SENT_COL_INDEX];
    if (!last) return false;
    return new Date(last).toDateString() === new Date().toDateString();
  }).length;

  const errors = rows.filter(r => (r[ERROR_COL_INDEX] || '').trim() !== '').length;

  const canSend =
    connections.gmail && connections.sheet && connections.template &&
    (!connections.attachmentRequired || connections.attachment) &&
    !state.missing.length;

  function toggle(i) {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  }

  function toggleAll() {
    setSelected(selected.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)));
  }

  // Build the per-row payload used by both dry run and real send.
  function buildSend(i) {
    const r = rows[i];
    const first = r[headerMap.first_name?.index] || '';
    const company = r[headerMap.company?.index] || '';
    const emails = extractEmails(r[headerMap.email?.index] || '');
    const subject = buildSubject(company);
    const body = applyTemplate(template, { first_name: first, company });
    return { first, company, emails, subject, body };
  }

  function dryRun(targetIdxs) {
    const out = [];
    out.push(`DRY RUN · ${new Date().toISOString()}`);
    out.push(`Attachment: ${connections.attachment ? '[sell-sheet.pdf]' : '(none)'}\n`);
    const updatedRows = rows.map(r => [...r]);
    let sentCount = 0;
    targetIdxs.forEach(i => {
      const r = updatedRows[i];
      const status = (r[headerMap.status?.index] || '').toLowerCase();
      if (status === 'first email sent') {
        out.push(`Row ${i + 1}: already sent, skipping`);
        return;
      }
      const { first, company, emails, subject, body } = buildSend(i);
      if (!emails.length) {
        out.push(`Row ${i + 1} (${first} @ ${company}): no valid email, skipping`);
        return;
      }
      out.push(`Row ${i + 1} (${first} @ ${company}):`);
      out.push(`  to:      ${emails.join(', ')}`);
      out.push(`  subject: ${subject}`);
      out.push(`  body:    ${body.slice(0, 80).replace(/\n/g, ' ')}…`);
      r[headerMap.status?.index] = FIRST_EMAIL_SENT;
      r[LAST_SENT_COL_INDEX] = new Date().toISOString().slice(0, 10);
      r[ERROR_COL_INDEX] = '';
      sentCount++;
    });
    out.push(`\nDone — ${sentCount} row(s) marked "${FIRST_EMAIL_SENT}".`);
    setLog(out);
    setState(s => ({ ...s, rows: updatedRows }));
    setSelected(new Set());
  }

  // Real send via /.netlify/functions/send-email. On success, the function
  // also writes 'First Email Sent' into the Google Sheet status cell.
  async function realSend(targetIdxs) {
    if (sending) return;
    setSending(true);
    const out = [`SEND · ${new Date().toISOString()}`];
    const updatedRows = rows.map(r => [...r]);
    const statusColLetter = headerMap.status ? colLetter(headerMap.status.index) : '';
    const lastSentColLetter = colLetter(LAST_SENT_COL_INDEX);
    const errorColLetter = colLetter(ERROR_COL_INDEX);
    let sentCount = 0;
    let failCount = 0;

    for (const i of targetIdxs) {
      const r = updatedRows[i];
      const status = (r[headerMap.status?.index] || '').toLowerCase();
      if (status === 'first email sent') {
        out.push(`Row ${i + 1}: already sent, skipping`);
        continue;
      }
      const { first, company, emails, subject, body } = buildSend(i);
      if (!emails.length) {
        out.push(`Row ${i + 1} (${first} @ ${company}): no valid email, skipping`);
        continue;
      }
      try {
        const res = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refresh_token: state.gmailRefreshToken,
            from_email: state.gmailAccount,
            to: emails[0],
            subject,
            body,
            sheet_url: state.sheetUrl,
            sheet_title: state.sheetTab || 'Sheet1',
            status_col_letter: statusColLetter,
            last_sent_col_letter: lastSentColLetter,
            error_col_letter: errorColLetter,
            row_number: i + 2, // +1 for 0-based, +1 for header row
          }),
        });
        const j = await res.json();
        if (!res.ok) {
          out.push(`Row ${i + 1}: ERROR — ${j.error || res.status}`);
          r[ERROR_COL_INDEX] = j.error || ('http ' + res.status);
          failCount++;
          continue;
        }
        out.push(`Row ${i + 1} (${first} @ ${company}): sent → ${emails[0]}`);
        r[headerMap.status?.index] = FIRST_EMAIL_SENT;
        r[LAST_SENT_COL_INDEX] = (j.sent_at || new Date().toISOString()).slice(0, 10);
        r[ERROR_COL_INDEX] = '';
        sentCount++;
      } catch (e) {
        out.push(`Row ${i + 1}: NETWORK ERROR — ${e.message}`);
        r[ERROR_COL_INDEX] = e.message;
        failCount++;
      }
    }

    out.push(`\nDone — ${sentCount} sent, ${failCount} failed.`);
    setLog(out);
    setState(s => ({ ...s, rows: updatedRows }));
    setSelected(new Set());
    setSending(false);
  }

  function onSendClick(idxs) {
    // If Gmail isn't really connected, fall back to dry run so the demo still works.
    if (connections.gmail && state.gmailRefreshToken && state.sheetUrl) {
      realSend(idxs);
    } else {
      dryRun(idxs);
    }
  }

  const targets = useMemo(() => {
    if (selected.size > 0) return [...selected];
    return rows.map((_, i) => i).filter(i =>
      (rows[i][headerMap.status?.index] || '').toLowerCase() !== 'first email sent'
    );
  }, [selected, rows, headerMap]);

  const previewRow = rows[[...selected][0] ?? 0];

  const connItems = [
    { label: 'Google Sheet', ok: connections.sheet },
    { label: 'Template', ok: connections.template },
    { label: 'Gmail', ok: connections.gmail },
    { label: 'Attachment', ok: connections.attachment },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{ready} lead{ready === 1 ? '' : 's'} ready to send</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Ready to send</div>
          <div className="stat-value">{ready}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sent Today</div>
          <div className={`stat-value${sentToday > 0 ? ' success' : ''}`}>{sentToday}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Errors</div>
          <div className={`stat-value${errors > 0 ? ' danger' : ''}`}>{errors}</div>
        </div>
      </div>

      <div className="connections-bar">
        {connItems.map(({ label, ok }) => (
          <div key={label} className={`conn-chip ${ok ? 'ok' : 'bad'}`}>
            <span className="conn-dot" />
            {label}
          </div>
        ))}
      </div>

      {state.missing.length > 0 && (
        <div className="alert alert-error">
          Missing required Sheet column(s): {state.missing.join(', ')}
        </div>
      )}

      <div className="actions-bar">
        <button
          className="btn btn-primary"
          disabled={!canSend || selected.size === 0 || sending}
          onClick={() => onSendClick([...selected])}
        >
          <SendIcon />
          {sending ? 'Sending…' : 'Send Selected'}
        </button>
        <button
          className="btn btn-secondary"
          disabled={!canSend || sending}
          onClick={() => onSendClick(targets)}
        >
          {sending ? 'Sending…' : 'Send All Ready'}
        </button>
        {!canSend && (
          <span style={{ fontSize: 13, color: 'var(--g3)' }}>
            Connect all required pieces to enable sending
          </span>
        )}
      </div>

      <LeadsTable
        rows={rows}
        headerMap={headerMap}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />

      <h2 className="section-title" style={{ marginTop: 28 }}>Email Preview</h2>
      <EmailPreview row={previewRow} headerMap={headerMap} template={template} />

      {log.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 28 }}>Send Log</h2>
          <pre className="send-log">{log.join('\n')}</pre>
        </>
      )}
    </>
  );
}
