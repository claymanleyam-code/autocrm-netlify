import { extractEmails } from '../utils/emailParser.js';
import { applyTemplate, toMinimalHtml, buildSubject } from '../utils/templateCleaner.js';

export default function EmailPreview({ row, headerMap, template }) {
  if (!row || !headerMap?.first_name) {
    return <div className="preview muted">Select a lead to preview the email.</div>;
  }
  const first = row[headerMap.first_name.index] || '';
  const company = row[headerMap.company.index] || '';
  const emails = extractEmails(row[headerMap.email.index] || '');
  const body = applyTemplate(template, { first_name: first, company });
  const html = toMinimalHtml(body);
  return (
    <div className="preview">
      <div className="meta"><b>To:</b> {emails.join(', ') || '(no valid emails)'}</div>
      <div className="meta"><b>Subject:</b> {buildSubject(company)}</div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
