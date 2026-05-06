import { useMemo, useState } from 'react';
import LeadsTable from './LeadsTable.jsx';
import EmailPreview from './EmailPreview.jsx';
import { extractEmails } from '../utils/emailParser.js';
import { applyTemplate, buildSubject } from '../utils/templateCleaner.js';

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
    out.push(`DRY RUN @ ${new Date().toISOString()}`);
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
        out.push(`Row ${i + 1} (${first}): ERROR no valid emails`);
        return;
      }
      const subject = buildSubject(company);
      const body = applyTemplate(template, { first_name: first, company });
      out.push(`Row ${i + 1} (${first} @ ${company}):`);
      out.push(`  to: ${emails.join(', ')}`);
      out.push(`  subject: ${subject}`);
      out.push(`  body: ${body.slice(0, 80).replace(/\n/g, ' ')}...`);
      r[headerMap.status.index] = 'first email sent';
      r[4] = new Date().toISOString().slice(0, 10);
      r[5] = '';
      sentCount++;
    });

    out.push(`\nDone. ${sentCount} row(s) marked "first email sent".`);
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

  return (
    <>
      <h2>Dashboard</h2>
      <div className="cards">
        <div className="card"><div className="label">Ready Leads</div><div className="value">{ready}</div></div>
        <div className="card"><div className="label">Sent Today</div><div className="value">{sentToday}</div></div>
        <div className="card"><div className="label">Errors</div><div className="value">{errors}</div></div>
        <div className="card"><div className="label">Google Sheet</div><div className={`status ${connections.sheet ? 'connected' : 'disconnected'}`}>{connections.sheet ? 'Connected' : 'Not connected'}</div></div>
        <div className="card"><div className="label">Doc Template</div><div className={`status ${connections.template ? 'connected' : 'disconnected'}`}>{connections.template ? 'Connected' : 'Not connected'}</div></div>
        <div className="card"><div className="label">Gmail</div><div className={`status ${connections.gmail ? 'connected' : 'disconnected'}`}>{connections.gmail ? 'Connected' : 'Not connected'}</div></div>
        <div className="card"><div className="label">Attachment</div><div className={`status ${connections.attachment ? 'connected' : 'disconnected'}`}>{connections.attachment ? 'Connected' : 'None'}</div></div>
      </div>

      {state.missing.length > 0 && (
        <div className="error">Missing required Sheet column(s): {state.missing.join(', ')}</div>
      )}

      <div style={{ margin: '12px 0' }}>
        <button className="btn" disabled={!canSend || selected.size === 0} onClick={() => dryRun([...selected])}>
          Send Selected (Dry Run)
        </button>
        <button className="btn secondary" disabled={!canSend} onClick={() => dryRun(targets)}>
          Send All Ready (Dry Run)
        </button>
        {!canSend && <span className="warn"> Connect all required pieces to enable sending.</span>}
      </div>

      <LeadsTable
        rows={rows}
        headerMap={headerMap}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
      />

      <h3 style={{ marginTop: 24 }}>Email Preview</h3>
      <EmailPreview row={previewRow} headerMap={headerMap} template={template} />

      {log.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Send Log</h3>
          <div className="log">{log.join('\n')}</div>
        </>
      )}
    </>
  );
}
