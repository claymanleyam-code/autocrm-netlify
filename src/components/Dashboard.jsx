import { useMemo, useState } from 'react';
import { parseEmailList, dedupeEmails } from '../utils/emailListParser.js';
import { extractEmailsFromFile } from '../utils/fileEmailExtractor.js';

const BATCH_SIZE = 200;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2L2 6.5l5 2L14 2zM9 8.5l3 5.5L14 2"/>
  </svg>
);

export default function Dashboard({ state, setState }) {
  const { connections } = state;
  const [recipientsText, setRecipientsText] = useState(state.pastedEmails || '');
  const [subject, setSubjectLocal] = useState(state.subject || '');
  const [log, setLog] = useState([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0 });
  const [fileBusy, setFileBusy] = useState(false);
  const [fileError, setFileError] = useState('');

  const fileEmails = state.fileEmails || [];

  const recipients = useMemo(
    () => dedupeEmails([...parseEmailList(recipientsText), ...fileEmails]),
    [recipientsText, fileEmails]
  );

  function saveRecipients() {
    setState(s => ({ ...s, pastedEmails: recipientsText }));
  }

  function saveSubject() {
    setState(s => ({ ...s, subject }));
  }

  async function onUploadFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFileError('');
    setFileBusy(true);
    try {
      const emails = await extractEmailsFromFile(f);
      if (!emails.length) {
        setFileError(`No email addresses found in "${f.name}".`);
      }
      setState(s => ({
        ...s,
        fileEmails: dedupeEmails([...(s.fileEmails || []), ...emails]),
        fileEmailsSource: f.name,
      }));
    } catch (err) {
      setFileError(`Could not read "${f.name}": ` + err.message);
    } finally {
      setFileBusy(false);
    }
  }

  function clearFileEmails() {
    setFileError('');
    setState(s => ({ ...s, fileEmails: [], fileEmailsSource: '' }));
  }

  const canSend =
    connections.gmail &&
    !!state.template &&
    !!subject &&
    recipients.length > 0;

  async function sendAll() {
    if (sending) return;
    setState(s => ({ ...s, pastedEmails: recipientsText, subject }));
    setSending(true);
    setProgress({ sent: 0, failed: 0 });
    const out = [
      `SEND · ${new Date().toISOString()}`,
      `Recipients: ${recipients.length}`,
      `Attachment: ${state.attachmentName || '(none)'}`,
      '',
    ];
    setLog([...out]);

    const batches = chunk(recipients, BATCH_SIZE);
    let sentCount = 0;
    let failCount = 0;
    const attachment = state.attachmentData
      ? { filename: state.attachmentName, mimeType: state.attachmentMimeType, data: state.attachmentData }
      : undefined;

    for (let b = 0; b < batches.length; b++) {
      out.push(`--- Batch ${b + 1}/${batches.length} (${batches[b].length} emails) ---`);
      setLog([...out]);
      for (const to of batches[b]) {
        try {
          const res = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refresh_token: state.gmailRefreshToken,
              from_email: state.gmailAccount,
              to,
              subject,
              body: state.template,
              attachment,
            }),
          });
          const j = await res.json();
          if (!res.ok) {
            out.push(`  ${to}: ERROR — ${j.error || res.status}`);
            failCount++;
          } else {
            out.push(`  ${to}: sent`);
            sentCount++;
          }
        } catch (e) {
          out.push(`  ${to}: NETWORK ERROR — ${e.message}`);
          failCount++;
        }
        setProgress({ sent: sentCount, failed: failCount });
        setLog([...out]);
      }
    }
    out.push('');
    out.push(`Done — ${sentCount} sent, ${failCount} failed.`);
    setLog(out);
    setSending(false);
  }

  const connItems = [
    { label: 'Template', ok: !!state.template },
    { label: 'Gmail', ok: connections.gmail },
    { label: 'Attachment', ok: connections.attachment },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Paste or upload recipients, confirm your template, and send in batches of {BATCH_SIZE}</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Recipients</div>
          <div className="stat-value">{recipients.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sent</div>
          <div className={`stat-value${progress.sent > 0 ? ' success' : ''}`}>{progress.sent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Errors</div>
          <div className={`stat-value${progress.failed > 0 ? ' danger' : ''}`}>{progress.failed}</div>
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

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-title">Recipients</div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          Paste email addresses below, and/or upload an Excel/CSV sheet or a PDF — every address found is merged into one list.
        </p>
        <textarea
          className="input"
          rows={6}
          style={{ maxWidth: '100%' }}
          placeholder={'jane@example.com\njohn@example.com\n...'}
          value={recipientsText}
          onChange={e => setRecipientsText(e.target.value)}
          onBlur={saveRecipients}
        />

        <div className="upload-zone" style={{ marginTop: 14 }}>
          <input type="file" accept=".xlsx,.xls,.csv,.pdf,application/pdf" onChange={onUploadFile} disabled={fileBusy} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--g2)' }}>
            {fileBusy ? 'Reading file…' : 'Click to upload an Excel/CSV sheet or PDF'}
          </div>
          <div className="upload-hint">emails are extracted automatically · .xlsx · .xls · .csv · .pdf</div>
        </div>

        {state.fileEmailsSource && (
          <div className="alert alert-success" style={{ marginTop: 12 }}>
            <span style={{ flex: 1 }}>
              <strong>{state.fileEmailsSource}</strong> — {fileEmails.length} address{fileEmails.length === 1 ? '' : 'es'} extracted
            </span>
            <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={clearFileEmails}>
              Clear
            </button>
          </div>
        )}
        {fileError && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>{fileError}</div>
        )}

        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{recipients.length} total valid address{recipients.length === 1 ? '' : 'es'} ready to send</p>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-title">Subject</div>
        <input
          className="input"
          placeholder="Subject line for every email"
          value={subject}
          onChange={e => setSubjectLocal(e.target.value)}
          onBlur={saveSubject}
        />
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Body comes from the <strong>Email Template</strong> tab — every recipient gets the exact same subject, body, and attachment.
        </p>
      </div>

      <div className="actions-bar">
        <button
          className="btn btn-primary"
          disabled={!canSend || sending}
          onClick={sendAll}
        >
          <SendIcon />
          {sending ? `Sending… (${progress.sent + progress.failed}/${recipients.length})` : `Send to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`}
        </button>
        {!canSend && (
          <span style={{ fontSize: 13, color: 'var(--g3)' }}>
            Connect Gmail, write a template, set a subject, and add at least one email to enable sending
          </span>
        )}
      </div>

      {log.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 28 }}>Send Log</h2>
          <pre className="send-log">{log.join('\n')}</pre>
        </>
      )}
    </>
  );
}
