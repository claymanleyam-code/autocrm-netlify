import { useState } from 'react';
import { parseDriveFileId } from '../utils/linkParser.js';

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
      connections: { ...s.connections, attachment: true }
    }));
  }
  function connectDrive() {
    const id = parseDriveFileId(url);
    if (!id) return alert('Invalid Google Drive link');
    setState(s => ({
      ...s,
      driveUrl: url, driveFileId: id,
      attachmentName: 'drive-file.pdf',
      attachmentSource: 'drive',
      connections: { ...s.connections, attachment: true }
    }));
    setFileName('drive-file.pdf');
  }
  function clear() {
    setFileName('');
    setState(s => ({
      ...s,
      attachmentName: '', attachmentSource: null, driveUrl: '', driveFileId: null,
      connections: { ...s.connections, attachment: false }
    }));
  }

  return (
    <>
      <h2>Attachments</h2>
      <p className="muted">Upload a PDF or paste a Google Drive link. Phase 2 will wire up actual attachment delivery.</p>
      <div className="section">
        <h3>Upload PDF</h3>
        <input type="file" accept="application/pdf" onChange={onFile} />
      </div>
      <div className="section">
        <h3>Or connect a Google Drive file</h3>
        <input className="input" placeholder="https://drive.google.com/file/d/..." value={url} onChange={e => setUrl(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={connectDrive}>Connect Drive File</button>
        </div>
      </div>
      <div className="section">
        <b>Attachment:</b> {fileName || '(none)'}
        {fileName && <button className="btn secondary" style={{ marginLeft: 8 }} onClick={clear}>Remove</button>}
      </div>
    </>
  );
}
