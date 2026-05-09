import React, { useState } from 'react';

export default function GoogleSheetTab({ ctx }) {
  const { sheetUrl, setSheetUrl, refreshToken, gmailConnected } = ctx;
  const [draft, setDraft] = useState(sheetUrl || '');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = () => { setSheetUrl(draft.trim()); };
  const clear = () => { setDraft(''); setSheetUrl(''); setPreview(null); };

  const test = async () => {
    setLoading(true); setError(''); setPreview(null);
    try {
      const r = await fetch('/.netlify/functions/sheets-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken, sheet_url: draft.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      setPreview(j);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-title">Google Sheet</div>
      {!gmailConnected && (
        <p style={{ color: '#a00' }}>Connect Gmail first to grant Sheets access.</p>
      )}
      <p>Paste the full Google Sheet URL (the one in your browser's address bar).</p>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/..."
        style={{ width: '100%', padding: 8, marginBottom: 12 }}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={save} disabled={!draft.trim()}>Save URL</button>
        <button onClick={test} disabled={!draft.trim() || !gmailConnected || loading}>{loading ? 'Testing…' : 'Test connection'}</button>
        <button onClick={clear}>Clear</button>
      </div>
      {sheetUrl && <p style={{ color: '#070' }}>Saved sheet: {sheetUrl}</p>}
      {error && <div className="banner banner-error">{error}</div>}
      {preview && (
        <div className="mapping-card">
          <strong>Sheet: {preview.sheetTitle}</strong>
          <p>Headers: {(preview.headers || []).join(' | ')}</p>
          <p>Detected: first name = {preview.mapping.firstName}, email = {preview.mapping.email}, company = {preview.mapping.company}, status = {preview.mapping.status}</p>
          <p>Rows: {preview.rows.length}</p>
          <p>First row: {preview.rows[0] ? `${preview.rows[0].firstName} <${preview.rows[0].email}> @ ${preview.rows[0].company}` : 'none'}</p>
        </div>
      )}
    </div>
  );
}
