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
import { mockHeaderRow, mockRows, defaultTemplate } from './tils/mockLeads.js';

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
          headerMap: map,
          missing,
          rows: mockRows,
          connections: {
                  sheet: false, template: false, gmail: false,
                  attachment: false, attachmentRequired: true
          },
    };
})();

export default function App() {
    const [tab, setTab] = useState('Dashboard');
    const [state, setState] = useState(initialState);

  // Persist state to localStorage
  useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Handle OAuth callback — pick up tokens from URL after Google redirect
  useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const authError = params.get('auth_error');

                if (authError) {
                        alert('Google OAuth error: ' + authError);
                        window.history.replaceState({}, '', '/');
                        return;
                }

                if (accessToken) {
                        const tokenData = {
                                  access_token: accessToken,
                                  refresh_token: params.get('refresh_token') || '',
                                  expires_in: parseInt(params.get('expires_in') || '3600'),
                                  token_type: params.get('token_type') || 'Bearer',
                                  obtained_at: Date.now()
                        };
                        localStorage.setItem('google_tokens', JSON.stringify(tokenData));
                        setState(s => ({
                                  ...s,
                                  gmailAccount: 'connected',
                                  connections: { ...s.connections, gmail: true }
                        }));
                        window.history.replaceState({}, '', '/');
                }
  }, []);

  return (
        <div className="app">
              <Sidebar active={tab} onChange={setTab} />
              <main className="main">
                {tab === 'Dashboard' && <Dashboard state={state} setState={setState} />}
                {tab === 'Leads' && (
                    <>
                                <h2>Leads</h2>
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
}</></div>
