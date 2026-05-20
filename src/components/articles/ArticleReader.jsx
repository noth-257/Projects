import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Edit3, Trash2, Folder, Clock, ChevronLeft,
  Highlighter, Minus, Plus, X,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { formatDate } from '../../utils/helpers';
import HighlightPopup from '../reader/HighlightPopup';
import HighlightSidebar from '../reader/HighlightSidebar';

export default function ArticleReader() {
  const {
    selectedArticle, setSelectedArticle, deleteArticle,
    getFolderById, openArticleModal, highlights, createHighlight,
    highlightColors, highlightColorOrder,
  } = useStore();

  const [deleting, setDeleting]                     = useState(false);
  const [showHighlightPanel, setShowHighlightPanel] = useState(false);
  const [popup, setPopup]                           = useState(null);
  const [scrollToId, setScrollToId]                 = useState(null);
  const [readProgress, setReadProgress]             = useState(0);
  const [fontSize, setFontSize]                     = useState(15);
  const [lastColor, setLastColor]                   = useState('yellow');
  const markRefs   = useRef({});
  const scrollRef  = useRef(null);

  // ── Scroll progress ──────────────────────────────────────
  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const total = el.scrollHeight - el.clientHeight;
    setReadProgress(total > 0 ? Math.round((el.scrollTop / total) * 100) : 0);
  }, []);

  // ── Jump to highlight ────────────────────────────────────
  const handleJumpTo = useCallback((id) => {
    setScrollToId(id);
    setTimeout(() => setScrollToId(null), 2000);
    const el = markRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Highlight creation ───────────────────────────────────
  const handleHighlightCreate = useCallback(async (colorId) => {
    if (!popup || !selectedArticle || !colorId) {
      setPopup(null);
      window.getSelection()?.removeAllRanges();
      return;
    }
    setLastColor(colorId);
    await createHighlight({
      articleId: selectedArticle.id,
      selectedText: popup.selectedText,
      color: colorId,
      startOffset: popup.startOffset,
      endOffset: popup.endOffset,
    });
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  }, [popup, selectedArticle, createHighlight]);

  // ── Text selection → show popup ──────────────────────────
  const handleMouseUp = useCallback((e) => {
    // Capture currentTarget BEFORE setTimeout (it's nullified after event ends)
    const container = e.currentTarget;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const selectedText = sel.toString().trim();
      if (!selectedText) return;

      const range = sel.getRangeAt(0);
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      const preRange = document.createRange();
      preRange.selectNodeContents(container);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const endOffset   = startOffset + sel.toString().length;

      const rect = range.getBoundingClientRect();
      setPopup({
        selectedText,
        startOffset,
        endOffset,
        position: { x: rect.left + rect.width / 2, y: rect.top },
      });
    }, 10);
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedArticle) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 'z':
          if (!e.shiftKey) { e.preventDefault(); document.execCommand('undo'); }
          else { e.preventDefault(); document.execCommand('redo'); }
          break;
        case 'y':
          e.preventDefault(); document.execCommand('redo');
          break;
        case 'b':
          e.preventDefault(); document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault(); document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault(); document.execCommand('underline');
          break;
        case 's':
          if (e.shiftKey) { e.preventDefault(); document.execCommand('strikeThrough'); }
          break;
        case 'x':
          e.preventDefault(); document.execCommand('cut');
          break;
        default: break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedArticle]);

  // ── All hooks done — early return AFTER all hooks ────────
  if (!selectedArticle) return <EmptyReader />;

  const folder = selectedArticle.folderId ? getFolderById(selectedArticle.folderId) : null;

  // Build highlight segments against plaintext
  const plainText = selectedArticle.content || '';
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const nonOverlapping = [];
  let lastEnd = 0;
  for (const h of sorted) {
    if (h.startOffset >= lastEnd) { nonOverlapping.push(h); lastEnd = h.endOffset; }
  }
  const segments = [];
  let cursor = 0;
  for (const h of nonOverlapping) {
    const s = Math.max(0, h.startOffset);
    const e2 = Math.min(plainText.length, h.endOffset);
    if (s > cursor) segments.push({ text: plainText.slice(cursor, s), hl: null });
    if (e2 > s) segments.push({ text: plainText.slice(s, e2), hl: h });
    cursor = e2;
  }
  if (cursor < plainText.length) segments.push({ text: plainText.slice(cursor), hl: null });

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
            {/* Font size */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg mr-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setFontSize((s) => Math.max(12, s - 1))} style={{ color: 'var(--text-muted,#9da4d4)' }}><Minus size={11} /></button>
              <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--text-muted,#9da4d4)' }}>{fontSize}</span>
              <button onClick={() => setFontSize((s) => Math.min(22, s + 1))} style={{ color: 'var(--text-muted,#9da4d4)' }}><Plus size={11} /></button>
            </div>

            {/* Highlights toggle */}
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

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin" onScroll={handleScroll}>
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

            {/*
              APPROACH: single contentEditable div that renders highlighted
              plain-text segments. The user reads the content with highlights
              visible. Bold/italic/underline/strikethrough work via execCommand
              on this div. No overlay, no ghost text.

              For rich reading view, we render ReactMarkdown BELOW (non-editable)
              and the highlight-aware plain text ABOVE it.
              
              Actually the cleanest approach: render only formatted markdown,
              and overlay highlights using a separate mechanism.
              
              FINAL CLEAN APPROACH:
              - Render ReactMarkdown for reading (prose styles)
              - For highlighting: use a contentEditable div that mirrors the
                content with colored marks. Selection fires popup.
              - NO transparent overlay — that caused ghost text.
              - The contentEditable div IS the reading surface.
            */}
            <div
              className="prose-dark outline-none"
              style={{ fontSize, lineHeight: 1.85, color: 'var(--text-primary, #e8eaf6)', caretColor: 'var(--accent, #5b8dee)' }}
              contentEditable
              suppressContentEditableWarning
              onMouseUp={handleMouseUp}
              spellCheck={false}
              data-article-id={selectedArticle.id}
            >
              {/*
                Render highlight segments as inline spans with mark backgrounds.
                Non-highlighted text renders normally.
                The entire div is editable so execCommand works on selections.
              */}
              {segments.length > 0 && nonOverlapping.length > 0
                ? segments.map((seg, i) => {
                  if (!seg.hl) {
                    // Non-highlighted: render as plain text span
                    return (
                      <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
                        {seg.text}
                      </span>
                    );
                  }
                  const c = highlightColors[seg.hl.color];
                  if (!c) return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{seg.text}</span>;
                  return (
                    <mark
                      key={i}
                      ref={(el) => { if (el) markRefs.current[seg.hl.id] = el; }}
                      style={{
                        background: c.bg,
                        borderBottom: `2px solid ${c.border}`,
                        color: 'inherit',
                        borderRadius: '2px',
                        padding: '0 2px',
                        boxShadow: scrollToId === seg.hl.id ? `0 0 0 2px ${c.dot}` : 'none',
                        transition: 'box-shadow 0.3s',
                      }}
                    >
                      {seg.text}
                    </mark>
                  );
                })
                : (
                  // No highlights yet — just render the plain text
                  // so execCommand works for formatting
                  <span style={{ whiteSpace: 'pre-wrap' }}>{plainText}</span>
                )
              }
            </div>

            {/* Formatted markdown view below the editable area */}
            <div className="prose-dark mt-8 pt-6 border-t pointer-events-none select-none"
              style={{ borderColor: 'var(--sidebar-border, rgba(255,255,255,0.06))', fontSize }}>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-4"
                style={{ color: 'var(--text-muted,#64748b)' }}>Formatted preview</p>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedArticle.content || ''}
              </ReactMarkdown>
            </div>

            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* Highlight panel — FIX #6: X close button */}
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
              style={{ color: 'var(--text-muted,#64748b)' }} title="Close">
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <HighlightSidebar onJumpTo={handleJumpTo} showHeader={false} />
          </div>
        </div>
      )}

      {/* Highlight popup */}
      {popup && (
        <HighlightPopup
          position={popup.position}
          onSelect={handleHighlightCreate}
          onClose={() => { setPopup(null); window.getSelection()?.removeAllRanges(); }}
          selectedColor={lastColor}
        />
      )}
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
