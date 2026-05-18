import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit3, Trash2, Folder, Clock, ChevronLeft, Highlighter, Minus, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { formatDate } from '../../utils/helpers';
import { HIGHLIGHT_COLORS } from '../../utils/highlightUtils';
import HighlightPopup from '../reader/HighlightPopup';
import HighlightSidebar from '../reader/HighlightSidebar';

export default function ArticleReader() {
  const {
    selectedArticle, setSelectedArticle, deleteArticle,
    getFolderById, openArticleModal, highlights, createHighlight,
    deleteHighlight, updateHighlightColor,
  } = useStore();

  const [deleting, setDeleting]                       = useState(false);
  const [showHighlightPanel, setShowHighlightPanel]   = useState(false);
  const [popup, setPopup]                             = useState(null);
  const [scrollToHighlightId, setScrollToHighlightId] = useState(null);
  const [readProgress, setReadProgress]               = useState(0);
  const [fontSize, setFontSize]                       = useState(15);
  const [lastColor, setLastColor]                     = useState('yellow');
  const contentRef        = useRef(null);
  const highlightMarkRefs = useRef({});

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const total = el.scrollHeight - el.clientHeight;
    setReadProgress(total > 0 ? Math.round((el.scrollTop / total) * 100) : 0);
  }, []);

  const handleHighlightCreate = useCallback(async (colorId) => {
    if (!popup || !selectedArticle || !colorId) { setPopup(null); window.getSelection()?.removeAllRanges(); return; }
    setLastColor(colorId);
    await createHighlight({ articleId: selectedArticle.id, selectedText: popup.selectedText, color: colorId, startOffset: popup.startOffset, endOffset: popup.endOffset });
    window.getSelection()?.removeAllRanges();
    setPopup(null);
  }, [popup, selectedArticle, createHighlight]);

  const handleFormat = useCallback((type) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const wrapChar = { bold: '**', italic: '*', underline: '__' }[type];
    if (!wrapChar) return;
    const text = sel.toString();
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.textContent = wrapChar + text + wrapChar;
    range.deleteContents();
    range.insertNode(span);
    setPopup(null);
  }, []);

  const handleJumpTo = useCallback((highlightId) => {
    setScrollToHighlightId(highlightId);
    setTimeout(() => setScrollToHighlightId(null), 2000);
    const el = highlightMarkRefs.current[highlightId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) return;
    const range = sel.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) return;
    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 1) return;
    const preRange = document.createRange();
    preRange.selectNodeContents(contentRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + sel.toString().length;
    const rect = range.getBoundingClientRect();
    setPopup({ selectedText, startOffset, endOffset, position: { x: rect.left + rect.width / 2, y: rect.top } });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!selectedArticle) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); handleFormat('bold'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); handleFormat('italic'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); handleFormat('underline'); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') { e.preventDefault(); handleFormat('strikethrough'); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedArticle, handleFormat]);

  if (!selectedArticle) return <EmptyReader />;

  const folder = selectedArticle.folderId ? getFolderById(selectedArticle?.folderId) : null;

  // Build segments
  const plainText = selectedArticle.content || '';
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const nonOverlapping = [];
  let lastEnd = 0;
  for (const h of sorted) { if (h.startOffset >= lastEnd) { nonOverlapping.push(h); lastEnd = h.endOffset; } }
  const segments = [];
  let cursor = 0;
  for (const h of nonOverlapping) {
    const start = Math.max(0, h.startOffset), end = Math.min(plainText.length, h.endOffset);
    if (start > cursor) segments.push({ text: plainText.slice(cursor, start), highlight: null });
    if (end > start) segments.push({ text: plainText.slice(start, end), highlight: h });
    cursor = end;
  }
  if (cursor < plainText.length) segments.push({ text: plainText.slice(cursor), highlight: null });

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
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedArticle(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-100 hover:bg-white/8 transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="text-xs text-ink-500 flex items-center gap-2">
              {folder && <span className="flex items-center gap-1"><Folder size={11} />{folder.name}</span>}
              <span className="flex items-center gap-1"><Clock size={11} />{formatDate(selectedArticle.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Font size */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg mr-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setFontSize((s) => Math.max(12, s - 1))} className="text-ink-400 hover:text-ink-100 transition-colors"><Minus size={11} /></button>
              <span className="text-ink-400 text-xs font-mono w-6 text-center">{fontSize}</span>
              <button onClick={() => setFontSize((s) => Math.min(22, s + 1))} className="text-ink-400 hover:text-ink-100 transition-colors"><Plus size={11} /></button>
            </div>
            {/* Highlights toggle */}
            <button onClick={() => setShowHighlightPanel((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${showHighlightPanel ? 'text-aurora-purple' : 'text-ink-400 hover:text-ink-200'}`}
              style={showHighlightPanel ? { background: 'rgba(155,109,255,0.15)', border: '1px solid rgba(155,109,255,0.3)' } : { border: '1px solid transparent' }}>
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
            <h1 className="font-bold text-ink-100 font-display leading-tight mb-3" style={{ fontSize: fontSize + 12 }}>
              {selectedArticle.title || 'Untitled'}
            </h1>
            {selectedArticle.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedArticle.tags.map((tag) => <Tag key={tag} label={tag} />)}
              </div>
            )}
            <hr style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.07))', marginBottom: '2rem' }} />

            {/* Selectable highlighted text */}
            <div ref={contentRef} className="relative" onMouseUp={handleMouseUp}>
              <div className="leading-relaxed whitespace-pre-wrap break-words" style={{ fontSize, color: 'var(--text-secondary,#c5c9e8)', lineHeight: 1.85 }}>
                {segments.length > 0 ? segments.map((seg, i) => {
                  if (!seg.highlight) return <span key={i}>{seg.text}</span>;
                  const c = HIGHLIGHT_COLORS[seg.highlight.color] || HIGHLIGHT_COLORS.yellow;
                  return (
                    <mark key={i}
                      ref={(el) => { if (el) highlightMarkRefs.current[seg.highlight.id] = el; }}
                      className="cursor-pointer transition-all duration-300 rounded-sm px-0.5"
                      style={{ background: c.bg, borderBottom: `2px solid ${c.border}`, color: 'inherit',
                        boxShadow: scrollToHighlightId === seg.highlight.id ? `0 0 0 2px ${c.dot}` : 'none' }}>
                      {seg.text}
                    </mark>
                  );
                }) : <span className="text-ink-500 italic">No content yet.</span>}
              </div>

              {/* Markdown view */}
              <div className="prose-dark mt-10 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', fontSize }}>
                <p className="text-ink-600 text-[10px] mb-4 font-mono uppercase tracking-widest">Formatted view</p>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedArticle.content || ''}</ReactMarkdown>
              </div>
            </div>
            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* Highlight panel */}
      {showHighlightPanel && (
        <div className="w-72 flex-shrink-0 border-l h-full animate-fade-in"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(13,15,26,0.97)' }}>
          <HighlightSidebar onJumpTo={handleJumpTo} />
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
      <h3 className="text-ink-200 font-semibold text-lg mb-2 font-display">Select an article</h3>
      <p className="text-ink-400 text-sm max-w-xs leading-relaxed">Choose an article to read, or create a new one.</p>
    </div>
  );
}
