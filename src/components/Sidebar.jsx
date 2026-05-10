const icons = {
  Dashboard: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.2"/>
      <rect x="9.5" y="1.5" width="5" height="5" rx="1.2"/>
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.2"/>
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.2"/>
    </svg>
  ),
  Leads: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5.5" r="2.5"/>
      <path d="M1 13.5v-.8A3.7 3.7 0 0 1 6 9a3.7 3.7 0 0 1 5 3.7v.8"/>
      <path d="M11 4a2 2 0 0 1 0 3.5M14 13.5v-.5a3 3 0 0 0-2-2.8"/>
    </svg>
  ),
  'Email Template': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5H4A1.5 1.5 0 0 0 2.5 3v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V6L9 1.5z"/>
      <path d="M9 1.5V6H13.5"/>
      <path d="M5.5 9.5h5M5.5 11.5h3"/>
    </svg>
  ),
  'Google Sheet': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="13" height="13" rx="2"/>
      <path d="M1.5 6h13M6 6v8.5"/>
    </svg>
  ),
  Attachments: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8.5L7.5 14.5a4 4 0 0 1-5.657-5.657l6.5-6.5a2.5 2.5 0 0 1 3.535 3.535L5.5 12.4a1 1 0 0 1-1.414-1.414l6-6"/>
    </svg>
  ),
  'Gmail Account': (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/>
      <path d="M1.5 5.5 8 9.5l6.5-4"/>
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2"/>
      <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9"/>
    </svg>
  ),
};

const NAV_GROUPS = [
  {
    label: 'Main',
    items: ['Dashboard', 'Leads'],
  },
  {
    label: 'Configure',
    items: ['Email Template', 'Google Sheet', 'Attachments', 'Gmail Account'],
  },
  {
    label: 'System',
    items: ['Settings'],
  },
];

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 20 20" fill="white">
            <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z"/>
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">AutoCRM</span>
          <span className="brand-tagline">Email Automation</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="nav-section">
            <div className="nav-section-label">{group.label}</div>
            {group.items.map(item => (
              <button
                key={item}
                className={`nav-item${active === item ? ' active' : ''}`}
                onClick={() => onChange(item)}
              >
                {icons[item]}
                {item}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">AutoCRM v0.1 · Phase 1</div>
    </aside>
  );
}
