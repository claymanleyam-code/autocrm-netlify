import React from 'react';

export default function EmailTemplateTab({ ctx }) {
  const { tmplSubject, setTmplSubject, tmplBody, setTmplBody } = ctx;
  return (
    <div>
      <div className="page-title">Email Template</div>
      <p>Use placeholders <code>{'{{first_name}}'}</code>, <code>{'{{company}}'}</code>, <code>{'{{email}}'}</code>.</p>
      <label>Subject</label>
      <input
        type="text"
        value={tmplSubject || ''}
        onChange={(e) => setTmplSubject(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 12 }}
      />
      <label>Body</label>
      <textarea
        value={tmplBody || ''}
        onChange={(e) => setTmplBody(e.target.value)}
        rows={12}
        style={{ width: '100%', padding: 8, fontFamily: 'inherit' }}
      />
      <p style={{ color: '#666', marginTop: 12 }}>Saved automatically.</p>
    </div>
  );
}
