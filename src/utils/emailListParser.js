// Shared helpers for turning free text into a clean, deduplicated list of email addresses.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function parseEmailList(text) {
  const matches = String(text || '').match(EMAIL_RE) || [];
  return dedupeEmails(matches);
}

export function dedupeEmails(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list || []) {
    const norm = String(raw || '').trim().toLowerCase();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}
