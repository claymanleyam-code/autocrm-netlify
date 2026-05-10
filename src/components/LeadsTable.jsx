import { extractEmails } from '../utils/emailParser.js';

function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-neutral">Pending</span>;
  const lower = status.toLowerCase();
  if (lower === 'first email sent') return <span className="badge badge-success">Sent</span>;
  if (lower === 'error') return <span className="badge badge-error">Error</span>;
  return <span className="badge badge-neutral">{status}</span>;
}

export default function LeadsTable({ rows, headerMap, selected, onToggle, onToggleAll }) {
  const allSelected = rows.length > 0 && selected.size === rows.length;

  return (
    <div className="table-wrap">
      <table className="leads-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Status</th>
            <th>Last Sent</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const fn   = r[headerMap.first_name?.index] || '';
            const em   = r[headerMap.email?.index] || '';
            const co   = r[headerMap.company?.index] || '';
            const st   = r[headerMap.status?.index] || '';
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
                <td style={{ fontWeight: 500 }}>{fn}</td>
                <td style={{ color: 'var(--g2)' }}>
                  {emails.length > 1 ? `${emails[0]} +${emails.length - 1}` : (emails[0] || em)}
                </td>
                <td>{co}</td>
                <td><StatusBadge status={st} /></td>
                <td style={{ color: 'var(--g2)', fontSize: 13 }}>{last || '—'}</td>
                <td style={{ color: 'var(--red-text)', fontSize: 13 }}>{err}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
