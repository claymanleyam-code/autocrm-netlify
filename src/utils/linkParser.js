// Extract IDs from Google Sheet / Doc / Drive links.
export function parseSheetId(url = '') {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}
export function parseDocId(url = '') {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}
export function parseDriveFileId(url = '') {
  const m =
    url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}
