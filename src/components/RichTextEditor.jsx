import { useEffect, useRef } from 'react';
import { sanitizeHtml } from '../utils/sanitizeHtml';

function plainTextToHtml(text) {
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

const DOTTED_DIVIDER = '<hr style="border:none;border-top:2px dotted #999999;margin:14px 0;">';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !editorRef.current) return;
    const looksLikeHtml = typeof value === 'string' && value.includes('<');
    editorRef.current.innerHTML = looksLikeHtml ? value : plainTextToHtml(value || '');
    initializedRef.current = true;
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const runCommand = (command, arg) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const handleInput = () => emitChange();

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    editorRef.current?.focus();
    if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html));
    } else if (text) {
      document.execCommand('insertText', false, text);
    }
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt('Link URL (https://...)');
    if (!url) return;
    if (window.getSelection()?.isCollapsed) {
      const label = window.prompt('Link text', url) || url;
      runCommand('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    } else {
      runCommand('createLink', url);
    }
  };

  const insertDivider = () => runCommand('insertHTML', DOTTED_DIVIDER);

  const insertImage = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      runCommand('insertImage', reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rte">
      <div className="btn-row" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('bold')} title="Bold"><b>B</b></button>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('italic')} title="Italic"><i>I</i></button>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('underline')} title="Underline"><u>U</u></button>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('insertUnorderedList')} title="Bulleted list">• List</button>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('insertOrderedList')} title="Numbered list">1. List</button>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={insertDivider} title="Insert dotted divider">┄ Divider</button>
        <button type="button" className="btn" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} title="Insert hyperlink">🔗 Link</button>
        <label className="btn" style={{ cursor: 'pointer', marginBottom: 0 }} title="Insert image">
          🖼 Image
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={insertImage} />
        </label>
      </div>
      <div
        ref={editorRef}
        className="input rte-body"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{ minHeight: 260, maxWidth: '100%', overflowY: 'auto', padding: 12, lineHeight: 1.5 }}
      />
    </div>
  );
}
