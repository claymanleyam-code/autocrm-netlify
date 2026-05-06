import { useState } from 'react';
import { parseDocId } from '../utils/linkParser.js';

export default function EmailTemplateTab({ state, setState }) {
  const [url, setUrl] = useState(state.docUrl || '');
  const [text, setText] = useState(state.template || '');

  function connect() {
    const id = parseDocId(url);
    if (!id) return alert('Invalid Google Doc link');
    setState(s => ({
      ...s,
      docUrl: url, docId: id,
      connections: { ...s.connections, template: true }
    }));
  }
  function saveTemplate() {
    setState(s => ({ ...s, template: text }));
  }

  return (
    <>
      <h2>Email Template</h2>
      <p className="muted">Paste your Google Doc link. Doc body will be fetched in Phase 2. For now, edit template text directly below.</p>
      <div className="section">
        <input className="input" placeholder="https://docs.google.com/document/d/..." value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <button className="btn" onClick={connect}>Connect Doc</button>
      {state.docId && <div className="section"><b>Doc ID:</b> {state.docId}</div>}

      <h3 style={{ marginTop: 16 }}>Template body (placeholders: {`{{first_name}}, {{company}}`})</h3>
      <textarea
        className="input"
        rows="10"
        style={{ maxWidth: 700, fontFamily: 'inherit' }}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={saveTemplate}>Save Template</button>
      </div>
    </>
  );
}
