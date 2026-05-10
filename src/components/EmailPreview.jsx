import { extractEmails } from '../utils/emailParser.js';
import { applyTemplate, toMinimalHtml, buildSubject } from '../utils/templateCleaner.js';

export default function EmailPreview({ row, headerMap, template }) {
  if (!row || !headerMap?.first_name) {
    return (
      <div className="panel" style={{ color: 'var(--g3)', fontSize: 14, textAlign: 'center', padding: '28px 24px' }}>
        Select a lead above to preview the email.
      </div>
    );
  }

  const first   = row[headerMap.first_name.index] || '';
  const company = row[headerMap.company.index] || '';
  const emails  = extractEmails(row[headerMap.email.index] || '');
  const body    = applyTemplate(template, { first_name: first, company });
  const html    = toMinimalHtml(body);

  return (
    <div className="panel">
      <div className="preview-field">
        <span className="preview-key">To</span>
        <span className="preview-val">{emails.join(', ') || '(no valid emails)'}</span>
      </div>
      <div className="preview-field">
        <span className="preview-key">Subject</span>
        <span className="preview-val">{buildSubject(company)}</span>
      </div>
      <div className="preview-divider" />
      <div className="preview-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
