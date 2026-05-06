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
}
