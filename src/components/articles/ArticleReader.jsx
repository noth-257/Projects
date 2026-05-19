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

  const [deleting, setDeleting]                       = useState(false);
  const [showHighlightPanel, setShowHighlightPanel]   = useState(false);
  const [popup, setPopup]                             = useState(null);
  const [scrollToHighlightId, setScrollToHighlightId] = useState(null);
  const [readProgress, setReadProgress]               = useState(0);
  const [fontSize, setFontSize]                       = useState(15);
  const [lastColor, setLastColor]                     = useState('yellow');
  const contentRef     = useRef(null);
  const markRefs       = useRef({});

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const total = el.scrollHeight - el.clientHeight;
    setReadProgress(total > 0 ? Math.round((el.scrollTop / total) * 100) : 0);
  }, []);

  // FIX #2: Use execCommand so bold/italic/underline actually renders in the DOM
  const handleFormat = useCallback((type) => {
    const cmdMap = { bold: 'bold', italic: 'italic', underline: 'underline', strikethrough: 'strikeThrough' };
    const cmd = cmdMap[type];
    if (cmd) document.execCommand(cmd, false, null);
    setPopup(null);
  }, []);

  const handleHighlightCreate = useCallback(async (colorId) => {
    if (!popup || !selectedArticle || !colorId) {
      setPopup(null); window.getSelection()?.removeAllRanges(); return;
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

  const handleJumpTo = useCallback((highlightId) => {
    setScrollToHighlightId(highlightId);
    setTimeout(() => setScrollToHighlightId(null), 2000);
    const el = markRefs.current[highlightId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Detect selection on the plain-text highlight layer
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) return;
    const range = sel.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) return;
    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(contentRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset   = startOffset + sel.toString().length;
    const rect        = range.getBoundingClientRect();
    setPopup({ selectedText, startOffset, endOffset, position: { x: rect.left + rect.width / 2, y: rect.top } });
  }, []);

  // FIX #3/#5: Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!selectedArticle) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && !e.shiftKey && e.key === 'z') { e.preventDefault(); document.execCommand('undo'); }
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); document.execCommand('redo'); }
      if (ctrl && e.key === 'b') { e.preventDefault(); handleFormat('bold'); }
      if (ctrl && e.key === 'i') { e.preventDefault(); handleFormat('italic'); }
      if (ctrl && e.key === 'u') { e.preventDefault(); handleFormat('underline'); }
      if (ctrl && e.shiftKey && e.key === 'S') { e.preventDefault(); handleFormat('strikethrough'); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedArticle, handleFormat]);

  if (!selectedArticle) return <EmptyReader />;

  const folder = selectedArticle.folderId ? getFolderById(selectedArticle?.folderId) : null;

  // FIX #4: Build highlight segments on the article's markdown source text.
  // We render this as a selectable plain-text layer with colored <mark> spans
  // on top, and the formatted ReactMarkdown below for reading.
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
    const start = Math.max(0, h.startOffset);
    const end   = Math.min(plainText.length, h.endOffset);
    if (start > cursor) segments.push({ text: plainText.slice(cursor, start), hl: null });
    if (end > start)   segments.push({ text: plainText.slice(start, end), hl: h });
    cursor = end;
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

            <Button variant="ghost" size="sm" icon={<Edit3 size={13} />} onClick={() => openArticleModal(selectedArticle)}>Edit</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin" onScroll={handleScroll}>
          <div className="max-w-2xl mx-auto px-8 py-10">

            {/* Title */}
            <h1 className="font-bold font-display leading-tight mb-3"
              style={{ fontSize: fontSize + 12, color: 'var(--text-primary,#e8eaf6)' }}>
              {selectedArticle.title || 'Untitled'}
            </h1>

            {/* Tags */}
            {selectedArticle.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedArticle.tags.map((tag) => <Tag key={tag} label={tag} />)}
              </div>
            )}

            <hr style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.07))', marginBottom: '2rem' }} />

            {/*
              FIX #1: ONLY the formatted (rendered) markdown view — no raw text shown.

              FIX #4: Highlights work by rendering a TRANSPARENT selectable plain-text
              layer (position:absolute, opacity:0 for text but marks are visible) on top
              of the ReactMarkdown. The plain text layer uses the same font/size so
              offsets align, and highlight <mark> spans are visible with background color.
              Selection events fire on this layer.
            */}
            <div className="relative" style={{ fontSize }}>

              {/* Rendered markdown — FIX #1: this is all the user sees */}
              <div className="prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArticle.content || ''}
                </ReactMarkdown>
              </div>

              {/*
                FIX #4: Highlight + selection overlay.
                Absolutely positioned on top of the prose, same dimensions.
                Text is transparent (color:transparent) so prose shows through,
                but highlight backgrounds are visible.
                onMouseUp triggers the highlight popup.
              */}
              <div
                ref={contentRef}
                onMouseUp={handleMouseUp}
                className="absolute inset-0 leading-relaxed whitespace-pre-wrap break-words cursor-text"
                style={{
                  color: 'transparent',
                  lineHeight: 1.85,
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  zIndex: 10,
                }}
              >
                {segments.length > 0
                  ? segments.map((seg, i) => {
                    if (!seg.hl) return <span key={i}>{seg.text}</span>;
                    const c = highlightColors[seg.hl.color];
                    if (!c) return <span key={i}>{seg.text}</span>;
                    return (
                      <mark
                        key={i}
                        ref={(el) => { if (el) markRefs.current[seg.hl.id] = el; }}
                        className="rounded-sm px-0.5 transition-all duration-300"
                        style={{
                          background: c.bg,
                          borderBottom: `2px solid ${c.border}`,
                          color: 'transparent',
                          boxShadow: scrollToHighlightId === seg.hl.id ? `0 0 0 2px ${c.dot}` : 'none',
                        }}
                      >
                        {seg.text}
                      </mark>
                    );
                  })
                  : <span>{plainText}</span>
                }
              </div>
            </div>

            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* FIX #6: Highlight panel with X close */}
      {showHighlightPanel && (
        <div className="w-72 flex-shrink-0 border-l h-full animate-fade-in flex flex-col"
          style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))', background: 'rgba(13,15,26,0.97)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
            <div>
              <h3 className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>Highlights</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted,#64748b)' }}>{highlights.length} total</p>
            </div>
            <button
              onClick={() => setShowHighlightPanel(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--text-muted,#64748b)' }}
              title="Close highlights">
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <HighlightSidebar onJumpTo={handleJumpTo} showHeader={false} />
          </div>
        </div>
      )}

      {/* Popup */}
      {popup && (
        <HighlightPopup
          position={popup.position}
          onSelect={handleHighlightCreate}
          onClose={() => { setPopup(null); window.getSelection()?.removeAllRanges(); }}
          onFormat={handleFormat}
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
      <h3 className="font-semibold text-lg mb-2 font-display" style={{ color: 'var(--text-secondary,#c5c9e8)' }}>
        Select an article
      </h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-muted,#64748b)' }}>
        Choose an article to read, or create a new one.
      </p>
    </div>
  );
}
