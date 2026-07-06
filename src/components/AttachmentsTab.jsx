import { useState } from 'react';

const PaperclipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 8.5L7.5 14.5a4 4 0 0 1-5.657-5.657l6.5-6.5a2.5 2.5 0 0 1 3.535 3.535L5.5 12.4a1 1 0 0 1-1.414-1.414l6-6"/>
  </svg>
);

const UploadIcon = () => (
  <svg className="upload-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 20a6 6 0 1 1 .79-11.94A8 8 0 1 1 24 16"/>
    <path d="M16 20v8M12 24l4-4 4 4"/>
  </svg>
);

const MAX_BYTES = 20 * 1024 * 1024;

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });
}

export default function AttachmentsTab({ state, setState }) {
  const [fileName, setFileName] = useState(state.attachmentName || '');
  const [error, setError] = useState('');

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError('That file is too large (max 20MB, Gmail attachment limit).');
      return;
    }
    setError('');
    try {
      const base64 = await readFileAsBase64(f);
      setFileName(f.name);
      setState(s => ({
        ...s,
        attachmentName: f.name,
        attachmentMimeType: f.type || 'application/octet-stream',
        attachmentData: base64,
        attachmentSource: 'upload',
        connections: { ...s.connections, attachment: true },
      }));
    } catch (err) {
      setError('Could not read that file: ' + err.message);
    }
  }

  function clear() {
    setFileName('');
    setError('');
    setState(s => ({
      ...s,
      attachmentName: '',
      attachmentMimeType: '',
      attachmentData: '',
      attachmentSource: null,
      connections: { ...s.connections, attachment: false },
    }));
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Attachment</h1>
        <p className="page-subtitle">Add one file to include with every email in the batch</p>
      </div>

      {fileName && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <PaperclipIcon />
            <strong>{fileName}</strong> attached
          </span>
          <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={clear}>
            Remove
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>
      )}

      <div className="panel">
        <div className="panel-title">Upload File</div>
        <div className="upload-zone">
          <input type="file" onChange={onFile} />
          <UploadIcon />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--g2)' }}>
            Click to upload a file
          </div>
          <div className="upload-hint">or drag and drop · any file type · max 20MB</div>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          This file is base64-encoded and sent as a real attachment on every email in the batch.
        </p>
      </div>
    </>
  );
}
