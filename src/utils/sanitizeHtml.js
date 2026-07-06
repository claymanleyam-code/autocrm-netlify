// src/utils/sanitizeHtml.js
// Lightweight allow-list HTML sanitizer for pasted/rich-text email template content.
// Strips scripts, event handlers, and unsafe URLs while keeping the formatting
// email clients (Gmail) understand: paragraphs, bold/italic/underline, lists,
// links, images, dividers, and basic inline styles.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI',
  'A', 'HR', 'IMG', 'BLOCKQUOTE', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH',
  'H1', 'H2', 'H3', 'H4', 'FONT', 'SUB', 'SUP',
]);

const ALLOWED_ATTRS = {
  A: ['href', 'target', 'rel'],
  IMG: ['src', 'alt', 'width', 'height', 'style'],
  FONT: ['color', 'face', 'size'],
  SPAN: ['style'],
  DIV: ['style'],
  P: ['style'],
  TD: ['style', 'colspan', 'rowspan'],
  TH: ['style', 'colspan', 'rowspan'],
  TABLE: ['style', 'border', 'cellpadding', 'cellspacing'],
  HR: ['style'],
};

const SAFE_STYLE_PROPS = new Set([
  'color', 'background-color', 'font-weight', 'font-style', 'font-size',
  'font-family', 'text-decoration', 'text-align', 'border', 'border-top',
  'border-bottom', 'border-style', 'margin', 'margin-top', 'margin-bottom',
  'padding', 'width', 'height', 'line-height',
]);

function sanitizeStyle(styleStr) {
  if (!styleStr) return '';
  return styleStr
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .filter((rule) => {
      const prop = rule.split(':')[0]?.trim().toLowerCase();
      return SAFE_STYLE_PROPS.has(prop);
    })
    .join('; ');
}

function isSafeUrl(url) {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('mailto:')
  );
}

export function sanitizeHtml(dirtyHtml) {
  const doc = new DOMParser().parseFromString(dirtyHtml || '', 'text/html');

  const walk = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') {
          child.remove();
          continue;
        }
        if (!ALLOWED_TAGS.has(tag)) {
          while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
          child.remove();
          continue;
        }
        const allowed = ALLOWED_ATTRS[tag] || [];
        Array.from(child.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on')) {
            child.removeAttribute(attr.name);
            return;
          }
          if (name === 'style') {
            child.setAttribute('style', sanitizeStyle(attr.value));
            return;
          }
          if (!allowed.includes(name)) {
            child.removeAttribute(attr.name);
            return;
          }
          if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
            child.removeAttribute(attr.name);
          }
        });
        if (tag === 'A') {
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        walk(child);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    }
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
