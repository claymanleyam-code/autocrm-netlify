import { extractEmails } from '../utils/emailParser.js';

export default function LeadsTable({ rows, headerMap, selected, onToggle, onToggleAll }) {
  const allSelected = rows.length > 0 && selected.size === rows.length;
  return (
    <table className="leads-table">
      <thead>
        <tr>
          <th><input type="checkbox" checked={allSelected} onChange={onToggleAll} /></th>
          <th>First Name</th><th>Email</th><th>Company</th>
          <th>Status</th><th>Last Email Sent</th><th>Error</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const fn  = r[headerMap.first_name?.index] || '';
          const em  = r[headerMap.email?.index] || '';
          const co  = r[headerMap.company?.index] || '';
          const st  = r[headerMap.status?.index] || '';
          const last = r[4] || '';
          const err  = r[5] || '';
          const skip = st.toLowerCase() === 'first email sent';
          const emails = extractEmails(em);
          return (
            <tr key={i} className={skip ? 'skip' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => onToggle(i)}
                  disabled={skip}
                />
              </td>
              <td>{fn}</td>
              <td>{emails.length > 1 ? `${emails[0]} (+${emails.length - 1})` : (emails[0] || em)}</td>
              <td>{co}</td>
              <td>{st || '—'}</td>
              <td>{last || '—'}</td>
              <td>{err || ''}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
