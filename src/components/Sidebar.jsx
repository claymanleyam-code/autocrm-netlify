import React from 'react';

export default function Sidebar({ tabs, active, onSelect }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-title">AutoCRM</div>
      <ul>
        {tabs.map((t) => (
          <li
            key={t.id}
            className={'sidebar-item' + (active === t.id ? ' active' : '')}
            onClick={() => onSelect(t.id)}
          >
            {t.label}
          </li>
        ))}
      </ul>
    </nav>
  );
}
