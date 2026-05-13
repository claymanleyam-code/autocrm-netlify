import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import GoogleSheetTab from './components/GoogleSheetTab.jsx';
import EmailTemplateTab from './components/EmailTemplateTab.jsx';
import AttachmentsTab from './components/AttachmentsTab.jsx';
import GmailAccountTab from './components/GmailAccountTab.jsx';
import Settings from './components/Settings.jsx';
import LeadsTable from './components/LeadsTable.jsx';
import { mapHeaders } from './utils/sheetMapping.js';
import { mockHeaderRow, mockRows, defaultTemplate } from './utils/mockLeads.js';

const STORAGE_KEY = 'autocrm-state-v1';

const initialState = (() => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const { map, missing } = mapHeaders(mockHeaderRow);
  return saved || {
    sheetUrl: '', sheetId: null, sheetTab: 'Sheet1',
    docUrl: '', docId: null,
    driveUrl: '', driveFileId: null,
    attachmentName: '', attachmentSource: null,
    gmailAccount: '',
    gmailRefreshToken: '',
    gmailAccessToken: '',
    gmailAccessTokenExpiresAt: 0,
    template: defaultTemplate,
    headerRow: mockHeaderRow,
    headerMap: map,
    missing,
    rows: mockRows,
    connections: {
      sheet: false, template: false, gmail: false,
      attachment: false, attachmentRequired: true
    }
  };
})();

export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [state, setState] = useState(initialState);

  // Handle Google OAuth callback: auth-google.js redirects to
  // /#gmail_connected&refresh_token=...&access_token=...&expires_in=...&email=...
  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#gmail_connected')) return;
    const qs = hash.replace(/^#gmail_connected&?/, '');
    const params = new URLSearchParams(qs);
    const refresh_token = params.get('refresh_token') || '';
    const access_token = params.get('access_token') || '';
    const expires_in = parseInt(params.get('expires_in') || '3600', 10);
    const email = params.get('email') || '';
    if (refresh_token || access_token) {
      setState(s => ({
        ...s,
        gmailAccount: email,
        gmailRefreshToken: refresh_token,
        gmailAccessToken: access_token,
        gmailAccessTokenExpiresAt: Date.now() + expires_in * 1000,
        connections: { ...s.connections, gmail: true },
      }));
      setTab('Gmail Account');
    }
    // Clean the URL so tokens don't linger in the address bar / history.
    history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <div className="app">
      <Sidebar active={tab} onChange={setTab} />
      <main className="main">
        {tab === 'Dashboard' && <Dashboard state={state} setState={setState} />}
        {tab === 'Leads' && (
          <>
            <div className="page-header">
              <h1 className="page-title">Leads</h1>
              <p className="page-subtitle">{state.rows.length} total leads</p>
            </div>
            <LeadsTable
              rows={state.rows}
              headerMap={state.headerMap}
              selected={new Set()}
              onToggle={() => {}}
              onToggleAll={() => {}}
            />
          </>
        )}
        {tab === 'Email Template' && <EmailTemplateTab state={state} setState={setState} />}
        {tab === 'Google Sheet' && <GoogleSheetTab state={state} setState={setState} />}
        {tab === 'Attachments' && <AttachmentsTab state={state} setState={setState} />}
        {tab === 'Gmail Account' && <GmailAccountTab state={state} setState={setState} />}
        {tab === 'Settings' && <Settings state={state} setState={setState} />}
      </main>
    </div>
  );
}
