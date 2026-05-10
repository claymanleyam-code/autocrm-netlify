import { useState } from 'react';
import { parseDriveFileId } from '../utils/linkParser.js';

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

export default function AttachmentsTab({ state, setState }) {
  const [url, setUrl] = useState(state.driveUrl || '');
  const [fileName, setFileName] = useState(state.attachmentName || '');

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setState(s => ({
      ...s,
      attachmentName: f.name,
      attachmentSource: 'upload',
      connections: { ...s.connections, attachment: true },
    }));
  }

  function connectDrive() {
    const id = parseDriveFileId(url);
    if (!id) return alert('Invalid Google Drive link');
    setState(s => ({
      ...s,
      driveUrl: url,
      driveFileId: id,
      attachmentName: 'drive-file.pdf',
      attachmentSource: 'drive',
      connections: { ...s.connections, attachment: true },
    }));
    setFileName('drive-file.pdf');
  }

  function clear() {
    setFileName('');
    setUrl('');
    setState(s => ({
      ...s,
      attachmentName: '',
      attachmentSource: null,
      driveUrl: '',
      driveFileId: null,
      connections: { ...s.connections, attachment: false },
    }));
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Attachments</h1>
        <p className="page-subtitle">Add a PDF to include with every email</p>
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

      <div className="panel">
        <div className="panel-title">Upload PDF</div>
        <div className="upload-zone">
          <input type="file" accept="application/pdf" onChange={onFile} />
          <UploadIcon />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--g2)' }}>
            Click to upload a PDF
          </div>
          <div className="upload-hint">or drag and drop · PDF only</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-title">Google Drive File</div>

        <div className="form-group">
          <label className="form-label">Drive file URL</label>
          <input
            className="input"
            placeholder="https://drive.google.com/file/d/…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={connectDrive}>Connect Drive File</button>

        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          Actual attachment delivery will be wired up in Phase 2.
        </p>
      </div>
    </>
  );
}
