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

export default function ArticleReader() {
  const {
    selectedArticle, setSelectedArticle, deleteArticle,
    getFolderById, openArticleModal, highlights, createHighlight,
    highlightColors, highlightColorOrder,
  } = useStore();

  // ── All hooks unconditionally at top ──────────────────────
  const [deleting, setDeleting]                     = useState(false);
  const [showHighlightPanel, setShowHighlightPanel] = useState(false);
  const [popup, setPopup]                           = useState(null);
  const [readProgress, setReadProgress]             = useState(0);
  const [fontSize, setFontSize]                     = useState(15);
  const [lastColor, setLastColor]                   = useState('yellow');
  const contentRef = useRef(null);

  // Memoize rendered HTML so it only recomputes when article or highlights change
  const renderedHTML = useMemo(() => {
    if (!selectedArticle) return '';
    return renderWithHighlights(
      selectedArticle.content || '',
      highlights,
      highlightColors,
    );
  }, [selectedArticle?.id, selectedArticle?.content, highlights, highlightColors]);

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const total = el.scrollHeight - el.clientHeight;
    setReadProgress(total > 0 ? Math.round((el.scrollTop / total) * 100) : 0);
  }, []);

  // Text selection → show popup
  const handleMouseUp = useCallback(() => {
    // Use setTimeout so selection is finalized; capture ref before
    const el = contentRef.current;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const selectedText = sel.toString().trim();
      if (!selectedText || !el) return;

      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return;

      // Compute offsets against the element's full textContent
      const preRange = document.createRange();
      preRange.selectNodeContents(el);
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

  // Keyboard shortcuts — execCommand works on the contentEditable div
  useEffect(() => {
    const handler = (e) => {
      if (!selectedArticle) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
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
  }, [selectedArticle]);

  // ── Early return AFTER all hooks ─────────────────────────
  if (!selectedArticle) return <EmptyReader />;

  const folder = selectedArticle.folderId
    ? getFolderById(selectedArticle.folderId)
    : null;

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
              {folder && (
                <span className="flex items-center gap-1">
                  <Folder size={11} />{folder.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={11} />{formatDate(selectedArticle.updatedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Font size */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg mr-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                style={{ color: 'var(--text-muted,#9da4d4)' }}><Minus size={11} /></button>
              <span className="text-xs font-mono w-6 text-center"
                style={{ color: 'var(--text-muted,#9da4d4)' }}>{fontSize}</span>
              <button onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                style={{ color: 'var(--text-muted,#9da4d4)' }}><Plus size={11} /></button>
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
              Single unified view:
              - dangerouslySetInnerHTML renders markdown as formatted HTML
                with highlight <mark> spans already injected by renderWithHighlights()
              - contentEditable=true enables text selection → popup, and execCommand
                for bold/italic/underline/strikethrough
              - No separate plain-text layer, no overlay, no ghost text
              - prose-dark gives all the heading/paragraph/code styles
            */}
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
                color: 'var(--text-primary, #e8eaf6)',
                caretColor: 'var(--accent, #5b8dee)',
                minHeight: '4rem',
              }}
              dangerouslySetInnerHTML={{ __html: renderedHTML }}
            />

            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* Highlight panel with X close */}
      {showHighlightPanel && (
        <div className="w-72 flex-shrink-0 border-l h-full animate-fade-in flex flex-col"
          style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))', background: 'rgba(13,15,26,0.97)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
            <div>
              <h3 className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>
                Highlights
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted,#64748b)' }}>
                {highlights.length} total
              </p>
            </div>
            <button onClick={() => setShowHighlightPanel(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'var(--text-muted,#64748b)' }} title="Close">
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <HighlightSidebar onJumpTo={(id) => {
              const el = contentRef.current?.querySelector(`[data-highlight-id="${id}"]`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }} showHeader={false} />
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
        style={{
          background: 'linear-gradient(135deg, rgba(91,141,238,0.1), rgba(155,109,255,0.1))',
          border: '1px solid rgba(91,141,238,0.15)',
        }}>
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
