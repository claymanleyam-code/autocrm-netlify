import React from 'react';

export default function Settings({ ctx }) {
  const reset = () => {
    if (!confirm('Clear all saved settings (refresh token, sheet URL, template)?')) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('autocrm.'))
      .forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div>
      <div className="page-title">Settings</div>
      <p>All settings are stored in this browser only.</p>
      <button onClick={reset}>Reset all saved settings</button>
    </div>
  );
}
