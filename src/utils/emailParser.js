// Extract & normalize emails from a single cell that may contain many.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function extractEmails(cell = '') {
  if (!cell) return [];
  const matches = String(cell).match(EMAIL_RE) || [];
  const seen = new Set();
  const out = [];
  for (const e of matches) {
    const norm = e.trim().toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}
