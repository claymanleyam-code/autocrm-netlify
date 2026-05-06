// Map header row -> canonical fields.
const ALIASES = {
  first_name: ['first name', 'firstname', 'first_name'],
  email: ['email', 'email address', 'emails', 'contact email'],
  company: ['company', 'company name', 'organization'],
  status: ['status', 'lead status', 'email status']
};

export function mapHeaders(headerRow = []) {
  const lower = headerRow.map(h => String(h || '').trim().toLowerCase());
  const map = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const idx = lower.findIndex(h => aliases.includes(h));
    map[field] = idx >= 0 ? { index: idx, header: headerRow[idx] } : null;
  }
  const missing = Object.keys(ALIASES).filter(k => !map[k]);
  return { map, missing };
}
