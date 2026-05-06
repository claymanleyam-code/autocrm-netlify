// Replace placeholders. Strip down to minimal Gmail-style HTML.
export function applyTemplate(template, vars) {
  let body = template || '';
  for (const [k, v] of Object.entries(vars)) {
    body = body.replaceAll(`{{${k}}}`, v ?? '');
  }
  return body;
}

// Crude minimal-HTML normalizer for plain-text templates.
export function toMinimalHtml(text = '') {
  const paras = text.split(/\n{2,}/).map(p =>
    `<p>${p.replace(/\n/g, '<br>').trim()}</p>`
  );
  return paras.join('\n');
}

export function buildSubject(company) {
  return `magic mind - quick introduction (${company || ''})`;
}
