import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import EmailTemplateTab from './components/EmailTemplateTab.jsx';
import GoogleSheetTab from './components/GoogleSheetTab.jsx';
import GmailAccountTab from './components/GmailAccountTab.jsx';
import Settings from './components/Settings.jsx';

const LS = {
  refresh: 'autocrm.refresh_token',
  email: 'autocrm.gmail_email',
  sheet: 'autocrm.sheet_url',
  tmplSubject: 'autocrm.tmpl_subject',
  tmplBody: 'autocrm.tmpl_body',
};

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v == null ? initial : v; } catch { return initial; }
  });
  useEffect(() => {
    try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch {}
  }, [key, val]);
  return [val, setVal];
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [refreshToken, setRefreshToken] = useLocalStorage(LS.refresh, '');
  const [gmailEmail, setGmailEmail] = useLocalStorage(LS.email, '');
  const [sheetUrl, setSheetUrl] = useLocalStorage(LS.sheet, '');
  const [tmplSubject, setTmplSubject] = useLocalStorage(
    LS.tmplSubject,
    'Quick intro from {{first_name}}'
  );
  const [tmplBody, setTmplBody] = useLocalStorage(
    LS.tmplBody,
    'Hi {{first_name}},\n\nI was looking at {{company}} and thought we might be a good fit.\n\nWould you have 15 minutes this week for a quick chat?\n\nThanks!'
  );
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    const qErr = url.searchParams.get('auth_error');
    if (qErr) {
      setAuthError(qErr);
      url.searchParams.delete('auth_error');
      window.history.replaceState({}, '', url.pathname + url.search);
      return;
    }
    const hash = window.location.hash || '';
    if (hash.startsWith('#gmail_connected')) {
      const frag = hash.replace(/^#gmail_connected&?/, '');
      const params = new URLSearchParams(frag);
      const rt = params.get('refresh_token') || '';
      const em = params.get('email') || '';
      if (rt) setRefreshToken(rt);
      if (em) setGmailEmail(em);
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  const gmailConnected = !!refreshToken;
  const sheetConnected = !!sheetUrl;

  const ctx = {
    refreshToken, setRefreshToken,
    gmailEmail, setGmailEmail,
    sheetUrl, setSheetUrl,
    tmplSubject, setTmplSubject,
    tmplBody, setTmplBody,
    gmailConnected, sheetConnected,
  };

  const tabs = useMemo(() => ([
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'template', label: 'Email Template' },
    { id: 'sheet', label: 'Google Sheet' },
    { id: 'gmail', label: 'Gmail Account' },
    { id: 'settings', label: 'Settings' },
  ]), []);

  return (
    <div className="app-shell">
      <Sidebar tabs={tabs} active={tab} onSelect={setTab} />
      <main className="app-main">
        {authError && (
          <div className="banner banner-error">
            Auth error: {authError}
            <button onClick={() => setAuthError('')}>dismiss</button>
          </div>
        )}
        {tab === 'dashboard' && <Dashboard ctx={ctx} />}
        {tab === 'template' && <EmailTemplateTab ctx={ctx} />}
        {tab === 'sheet' && <GoogleSheetTab ctx={ctx} />}
        {tab === 'gmail' && <GmailAccountTab ctx={ctx} />}
        {tab === 'settings' && <Settings ctx={ctx} />}
      </main>
    </div>
  );
}
