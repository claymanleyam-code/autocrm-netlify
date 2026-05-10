import { useMemo, useState } from 'react';
import LeadsTable from './LeadsTable.jsx';
import EmailPreview from './EmailPreview.jsx';
import { extractEmails } from '../utils/emailParser.js';
import { applyTemplate, buildSubject } from '../utils/templateCleaner.js';

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2L2 6.5l5 2L14 2zM9 8.5l3 5.5L14 2"/>
  </svg>
);

export default function Dashboard({ state, setState }) {
  const { rows, headerMap, template, connections } = state;
  const [selected, setSelected] = useState(new Set());
  const [log, setLog] = useState([]);

  const ready = rows.filter(r =>
    (r[headerMap.status?.index] || '').toLowerCase() !== 'first email sent'
  ).length;

  const sentToday = rows.filter(r => {
    const last = r[4];
    if (!last) return false;
    return new Date(last).toDateString() === new Date().toDateString();
  }).length;

  const errors = rows.filter(r => (r[5] || '').trim() !== '').length;

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

  function dryRun(targetIdxs) {
    const out = [];
    out.push(`DRY RUN  ·  ${new Date().toISOString()}`);
    out.push(`Attachment: ${connections.attachment ? '[sell-sheet.pdf]' : '(none)'}\n`);

    const updatedRows = rows.map(r => [...r]);
    let sentCount = 0;

    targetIdxs.forEach(i => {
      const r = updatedRows[i];
      const status = (r[headerMap.status.index] || '').toLowerCase();
      if (status === 'first email sent') {
        out.push(`Row ${i + 1}: SKIP (already sent)`);
        return;
      }
      const first = r[headerMap.first_name.index] || '';
      const company = r[headerMap.company.index] || '';
      const emails = extractEmails(r[headerMap.email.index] || '');
      if (!emails.length) {
        r[headerMap.status.index] = 'Error';
        r[5] = 'No valid emails';
        out.push(`Row ${i + 1} (${first}): ERROR — no valid emails`);
        return;
      }
      const subject = buildSubject(company);
      const body = applyTemplate(template, { first_name: first, company });
      out.push(`Row ${i + 1} (${first} @ ${company}):`);
      out.push(`  to:      ${emails.join(', ')}`);
      out.push(`  subject: ${subject}`);
      out.push(`  body:    ${body.slice(0, 80).replace(/\n/g, ' ')}…`);
      r[headerMap.status.index] = 'first email sent';
      r[4] = new Date().toISOString().slice(0, 10);
      r[5] = '';
      sentCount++;
    });

    out.push(`\nDone — ${sentCount} row(s) marked "first email sent".`);
    setLog(out);
    setState(s => ({ ...s, rows: updatedRows }));
    setSelected(new Set());
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
    { label: 'Template',     ok: connections.template },
    { label: 'Gmail',        ok: connections.gmail },
    { label: 'Attachment',   ok: connections.attachment },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{ready} lead{ready !== 1 ? 's' : ''} ready to send</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Ready to Send</div>
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
          disabled={!canSend || selected.size === 0}
          onClick={() => dryRun([...selected])}
        >
          <SendIcon />
          Send Selected
        </button>
        <button
          className="btn btn-secondary"
          disabled={!canSend}
          onClick={() => dryRun(targets)}
        >
          Send All Ready
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
          <div className="log">{log.join('\n')}</div>
        </>
      )}
    </>
  );
}
