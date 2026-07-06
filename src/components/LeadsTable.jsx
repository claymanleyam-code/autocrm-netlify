// Simple recipient list — just email addresses, no name/company/status tracking.
export default function LeadsTable({ emails = [] }) {
  return (
    <div className="table-wrap">
      <table className="leads-table">
        <thead>
          <tr>
            <th style={{ width: 50 }}>#</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email, i) => (
            <tr key={email + i}>
              <td style={{ color: 'var(--g3)' }}>{i + 1}</td>
              <td style={{ color: 'var(--g2)' }}>{email}</td>
            </tr>
          ))}
          {emails.length === 0 && (
            <tr>
              <td colSpan={2} className="muted" style={{ padding: 16 }}>
                No recipients yet — paste emails or upload a file on the Dashboard.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
