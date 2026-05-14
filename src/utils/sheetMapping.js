// Map header row -> canonical fields.
// Aliases use loose contains-matching so messy multi-line / store-name headers still resolve.
const ALIASES = {
  first_name: [
    'first name', 'firstname', 'first_name',
    'contact name', 'contact', 'lead name', 'lead', 'full name',
    'name', 'rep name', 'first'
  ],
  email: ['email address', 'contact email', 'email', 'e-mail', 'mail', 'emails'],
  company: [
    'company name', 'company',
    'store', 'stores', 'retailer', 'chain', 'group',
    'organization', 'org', 'business', 'employer',
    'account name', 'account'
  ],
  status: ['lead status', 'email status', 'outreach status', 'pipeline', 'stage', 'state', 'status']
};

function normalize(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findColumn(loweredHeaders, aliases) {
  // Exact match first
  for (const a of aliases) {
    const i = loweredHeaders.findIndex(h => h === a);
    if (i >= 0) return i;
  }
  // Substring match (alias contained in header)
  for (const a of aliases) {
    const i = loweredHeaders.findIndex(h => h && h.includes(a));
    if (i >= 0) return i;
  }
  return -1;
}

export function mapHeaders(headerRow = []) {
  const lower = headerRow.map(normalize);
  const map = {};
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const idx = findColumn(lower, aliases);
    map[field] = idx >= 0 ? { index: idx, header: headerRow[idx] } : null;
  }
  // Fallback: if company still missing, use the first column (usually the store/account label).
  if (!map.company && headerRow.length > 0) {
    const taken = new Set(
      [map.first_name?.index, map.email?.index, map.status?.index]
        .filter(v => v !== undefined && v !== null)
    );
    let fallbackIdx = 0;
    while (taken.has(fallbackIdx) && fallbackIdx < headerRow.length) fallbackIdx++;
    if (fallbackIdx < headerRow.length) {
      map.company = { index: fallbackIdx, header: headerRow[fallbackIdx] };
    }
  }
  // Fallback for first_name: any header containing 'name' that isn't already mapped.
  if (!map.first_name) {
    const taken = new Set(
      [map.company?.index, map.email?.index, map.status?.index]
        .filter(v => v !== undefined && v !== null)
    );
    const idx = lower.findIndex((h, i) => h && h.includes('name') && !taken.has(i));
    if (idx >= 0) map.first_name = { index: idx, header: headerRow[idx] };
  }
  const missing = Object.keys(ALIASES).filter(k => !map[k]);
  return { map, missing };
}

// Pull just the first word from a value like "Ali Light- UNFI Acct Manager" so templates render "Hi Ali".
export function extractFirstName(value) {
  if (!value) return '';
  const cleaned = String(value).replace(/[\-\u2013\u2014]/g, ' ').trim();
  const first = cleaned.split(/\s+/)[0] || '';
  return first.replace(/[^A-Za-z'\-]/g, '');
}
