import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Edit3, Trash2, Folder, Clock, ChevronLeft,
  Highlighter, Minus, Plus, X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { formatDate } from '../../utils/helpers';
import { renderWithHighlights } from '../../utils/renderWithHighlights';
import HighlightPopup from '../reader/HighlightPopup';
import HighlightSidebar from '../reader/HighlightSidebar';

// ── Toast notification ────────────────────────────────────────
function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 rounded-2xl text-sm font-medium animate-fade-in pointer-events-none"
      style={{
        background: 'linear-gradient(135deg, rgba(18,21,42,0.98), rgba(12,14,28,0.98))',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        color: '#e8eaf6',
      }}
    >
      {message}
    </div>
  );
}

export default function ArticleReader() {
  const {
    selectedArticle, setSelectedArticle, deleteArticle,
    getFolderById, openArticleModal, highlights, createHighlight,
    highlightColors,
  } = useStore();

  const [deleting, setDeleting]                     = useState(false);
  const [showHighlightPanel, setShowHighlightPanel] = useState(false);
  const [popup, setPopup]                           = useState(null);
  const [readProgress, setReadProgress]             = useState(0);
  const [fontSize, setFontSize]                     = useState(15);
  const [lastColor, setLastColor]                   = useState('yellow');
  const [toast, setToast]                           = useState('');

  const contentRef     = useRef(null);
  const popupActiveRef = useRef(false);
  // FIX #1: Store the CURRENT innerHTML of the content div (including any
  // execCommand changes like bold/italic), not just the initial rendered HTML.
  // We update this ref after every DOM mutation so closePopup restores correctly.
  const currentHTMLRef = useRef('');
  const toastTimerRef  = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 1200);
  }, []);

  // Rendered HTML from markdown + highlights
  const renderedHTML = useMemo(() => {
    if (!selectedArticle) return '';
    return renderWithHighlights(
      selectedArticle.content || '',
      highlights,
      highlightColors,
    );
  }, [selectedArticle?.id, selectedArticle?.content, highlights, highlightColors]);

  // Apply HTML to DOM — skip while popup is open to preserve selection
  useEffect(() => {
    const el = contentRef.current;
    if (!el || popupActiveRef.current) return;
    el.innerHTML = renderedHTML;
    currentHTMLRef.current = renderedHTML;
  }, [renderedHTML]);

  // MutationObserver: keep currentHTMLRef in sync with any DOM changes
  // (execCommand bold/italic modifies the DOM directly)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const obs = new MutationObserver(() => {
      // Only update when popup is NOT active (no selection in progress)
      if (!popupActiveRef.current) {
        currentHTMLRef.current = el.innerHTML;
      }
    });
    obs.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => obs.disconnect();
  }, []);

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const total = el.scrollHeight - el.clientHeight;
    setReadProgress(total > 0 ? Math.round((el.scrollTop / total) * 100) : 0);
  }, []);

  const handleMouseUp = useCallback(() => {
    const el = contentRef.current;
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const selectedText = sel.toString().trim();
      if (!selectedText || !el) return;

      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return;

      const preRange = document.createRange();
      preRange.selectNodeContents(el);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const endOffset   = startOffset + sel.toString().length;

      const rect = range.getBoundingClientRect();
      popupActiveRef.current = true;
      setPopup({
        selectedText,
        startOffset,
        endOffset,
        position: { x: rect.left + rect.width / 2, y: rect.top },
      });
    });
  }, []);

  // FIX #1: closePopup restores currentHTMLRef (which includes bold/italic changes),
  // NOT the original renderedHTML. This preserves execCommand formatting.
  const closePopup = useCallback(() => {
    popupActiveRef.current = false;
    setPopup(null);
    window.getSelection()?.removeAllRanges();
    // Restore the current state of the DOM (with any formatting applied)
    if (contentRef.current) {
      contentRef.current.innerHTML = currentHTMLRef.current;
    }
  }, []);

  // FIX #3: Format and auto-deselect
  const applyFormat = useCallback((cmd) => {
    // execCommand needs the selection to still be active — run it first
    document.execCommand(cmd, false, null);
    // Update currentHTMLRef immediately after formatting
    if (contentRef.current) {
      currentHTMLRef.current = contentRef.current.innerHTML;
    }
    // Then clear selection and close popup
    window.getSelection()?.removeAllRanges();
    popupActiveRef.current = false;
    setPopup(null);
  }, []);

  // FIX #3: Cut/copy/paste with toast notification
  const applyClipboard = useCallback((action) => {
    if (action === 'cut') {
      document.execCommand('cut');
      if (contentRef.current) currentHTMLRef.current = contentRef.current.innerHTML;
      showToast('✂️ Cut');
    } else if (action === 'copy') {
      document.execCommand('copy');
      showToast('📋 Copied');
    } else if (action === 'paste') {
      navigator.clipboard.readText().then((text) => {
        document.execCommand('insertText', false, text);
        if (contentRef.current) currentHTMLRef.current = contentRef.current.innerHTML;
        showToast('📌 Pasted');
      }).catch(() => {
        document.execCommand('paste');
        showToast('📌 Pasted');
      });
    }
    // Deselect after clipboard action
    window.getSelection()?.removeAllRanges();
    popupActiveRef.current = false;
    setPopup(null);
  }, [showToast]);

  const handleHighlightCreate = useCallback(async (colorId) => {
    if (!popup || !selectedArticle || !colorId) {
      closePopup();
      return;
    }
    setLastColor(colorId);
    const savedPopup = popup;
    popupActiveRef.current = false;
    setPopup(null);
    window.getSelection()?.removeAllRanges();
    await createHighlight({
      articleId: selectedArticle.id,
      selectedText: savedPopup.selectedText,
      color: colorId,
      startOffset: savedPopup.startOffset,
      endOffset: savedPopup.endOffset,
    });
  }, [popup, selectedArticle, createHighlight, closePopup]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!selectedArticle) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const sel = window.getSelection();
      const hasSel = sel && !sel.isCollapsed && sel.toString().trim().length > 0;

      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          document.execCommand(e.shiftKey ? 'redo' : 'undo');
          break;
        case 'y':
          e.preventDefault();
          document.execCommand('redo');
          break;
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
        case 's':
          if (e.shiftKey) { e.preventDefault(); document.execCommand('strikeThrough'); }
          break;
        case 'x':
          e.preventDefault();
          document.execCommand('cut');
          break;
        default: break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedArticle, applyFormat, applyClipboard]);

  if (!selectedArticle) return <EmptyReader />;

  const folder = selectedArticle.folderId ? getFolderById(selectedArticle.folderId) : null;

  const handleDelete = async () => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(true);
    await deleteArticle(selectedArticle.id);
    setDeleting(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Progress bar */}
        <div className="h-0.5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full transition-all duration-300"
            style={{ width: `${readProgress}%`, background: 'linear-gradient(90deg, #5b8dee, #9b6dff)' }} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedArticle(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/8"
              style={{ color: 'var(--text-muted,#9da4d4)' }}>
              <ChevronLeft size={16} />
            </button>
            <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted,#64748b)' }}>
              {folder && <span className="flex items-center gap-1"><Folder size={11} />{folder.name}</span>}
              <span className="flex items-center gap-1"><Clock size={11} />{formatDate(selectedArticle.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg mr-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setFontSize((s) => Math.max(12, s - 1))} style={{ color: 'var(--text-muted,#9da4d4)' }}><Minus size={11} /></button>
              <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--text-muted,#9da4d4)' }}>{fontSize}</span>
              <button onClick={() => setFontSize((s) => Math.min(22, s + 1))} style={{ color: 'var(--text-muted,#9da4d4)' }}><Plus size={11} /></button>
            </div>
            <button onClick={() => setShowHighlightPanel((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={showHighlightPanel
                ? { background: 'rgba(155,109,255,0.15)', border: '1px solid rgba(155,109,255,0.3)', color: '#a78bfa' }
                : { border: '1px solid transparent', color: 'var(--text-muted,#9da4d4)' }}>
              <Highlighter size={13} />
              {highlights.length > 0 && <span>{highlights.length}</span>}
            </button>
            <Button variant="ghost" size="sm" icon={<Edit3 size={13} />}
              onClick={() => openArticleModal(selectedArticle)}>Edit</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />}
              loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin" onScroll={handleScroll}>
          <div className="max-w-2xl mx-auto px-8 py-10">
            <h1 className="font-bold font-display leading-tight mb-3"
              style={{ fontSize: fontSize + 12, color: 'var(--text-primary,#e8eaf6)' }}>
              {selectedArticle.title || 'Untitled'}
            </h1>
            {selectedArticle.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedArticle.tags.map((tag) => <Tag key={tag} label={tag} />)}
              </div>
            )}
            <hr style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.07))', marginBottom: '2rem' }} />
            <div
              ref={contentRef}
              className="prose-dark outline-none"
              contentEditable
              suppressContentEditableWarning
              onMouseUp={handleMouseUp}
              spellCheck={false}
              style={{
                fontSize,
                lineHeight: 1.85,
                color: 'var(--text-primary,#e8eaf6)',
                caretColor: 'var(--accent,#5b8dee)',
                minHeight: '4rem',
              }}
            />
            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* Highlight panel */}
      {showHighlightPanel && (
        <div className="w-72 flex-shrink-0 border-l h-full animate-fade-in flex flex-col"
          style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))', background: 'rgba(13,15,26,0.97)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
            <div>
              <h3 className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>Highlights</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted,#64748b)' }}>{highlights.length} total</p>
            </div>
            <button onClick={() => setShowHighlightPanel(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--text-muted,#64748b)' }}><X size={15} /></button>
          </div>
          <div className="flex-1 overflow-hidden">
            <HighlightSidebar
              onJumpTo={(id) => {
                const el = contentRef.current?.querySelector(`[data-highlight-id="${id}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              showHeader={false}
            />
          </div>
        </div>
      )}

      {/* Popup */}
      {popup && (
        <HighlightPopup
          position={popup.position}
          onSelect={handleHighlightCreate}
          onClose={closePopup}
          onFormat={applyFormat}
          onClipboard={applyClipboard}
          selectedColor={lastColor}
        />
      )}

      {/* Toast */}
      <Toast message={toast} />
    </div>
  );
}

function EmptyReader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 h-full animate-fade-in">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(91,141,238,0.1), rgba(155,109,255,0.1))', border: '1px solid rgba(91,141,238,0.15)' }}>
        <span className="text-4xl">📖</span>
      </div>
      <h3 className="font-semibold text-lg mb-2 font-display" style={{ color: 'var(--text-secondary,#c5c9e8)' }}>Select an article</h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-muted,#64748b)' }}>Choose an article to read, or create a new one.</p>
    </div>
  );
}
