const TABS = [
  'Dashboard', 'Leads', 'Email Template',
  'Google Sheet', 'Attachments', 'Gmail Account', 'Settings'
];

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <h1>AutoCRM</h1>
      {TABS.map(t => (
        <button
          key={t}
          className={active === t ? 'active' : ''}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </aside>
  );
}
