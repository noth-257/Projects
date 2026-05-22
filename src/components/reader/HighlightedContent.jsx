import { useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HIGHLIGHT_COLORS } from '../../utils/highlightUtils';

/**
 * HighlightedContent
 *
 * Approach: render markdown first (invisible), extract plainText from the
 * rendered DOM, compute character offsets, then overlay highlights as
 * <mark> spans on top of the plainText using a parallel highlighted-text layer.
 *
 * We avoid fragile DOM re-injection. Instead we use a two-layer approach:
 *   Layer 1: markdown rendered normally (provides correct HTML structure)
 *   Layer 2: plain-text with highlight spans via buildSegments()
 *
 * Since markdown re-renders on content change, highlights re-apply automatically.
 *
 * Selection → offset computation happens against the plainText layer container.
 */
export default function HighlightedContent({
  content,
  highlights,
  onSelectionEnd,
  onHighlightClick,
  scrollToHighlightId,
}) {
  const containerRef = useRef(null);
  const highlightRefs = useRef({});

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) return;

    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    // Compute offsets against container's full textContent
    const preRange = document.createRange();
    preRange.selectNodeContents(containerRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + sel.toString().length;

    const rect = range.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    onSelectionEnd({ selectedText, startOffset, endOffset, position: { x, y } });
  }, [onSelectionEnd]);

  // Build segments: plain text interspersed with highlight spans
  const plainText = content || '';

  // Sort highlights, remove overlaps
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
    const end = Math.min(plainText.length, h.endOffset);
    if (start > cursor) segments.push({ text: plainText.slice(cursor, start), highlight: null });
    if (end > start) segments.push({ text: plainText.slice(start, end), highlight: h });
    cursor = end;
  }
  if (cursor < plainText.length) segments.push({ text: plainText.slice(cursor), highlight: null });

  return (
    <div className="relative">
      {/* ── Highlighted plain-text layer ── */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="prose-dark select-text whitespace-pre-wrap break-words font-sans text-sm leading-relaxed"
        style={{ fontFamily: 'Sora, system-ui, sans-serif', lineHeight: '1.85', color: '#c5c9e8' }}
      >
        {segments.map((seg, i) => {
          if (!seg.highlight) return <span key={i}>{seg.text}</span>;
          const c = HIGHLIGHT_COLORS[seg.highlight.color] || HIGHLIGHT_COLORS.yellow;
          const isTarget = scrollToHighlightId === seg.highlight.id;
          return (
            <mark
              key={i}
              ref={(el) => { if (el) highlightRefs.current[seg.highlight.id] = el; }}
              onClick={() => onHighlightClick(seg.highlight)}
              className="cursor-pointer transition-all duration-200 rounded px-0.5"
              style={{
                background: c.bg,
                borderBottom: `2px solid ${c.border}`,
                color: 'inherit',
                outline: isTarget ? `2px solid ${c.dot}` : 'none',
                outlineOffset: '2px',
              }}
              title={`${c.label} — click to manage`}
            >
              {seg.text}
            </mark>
          );
        })}
      </div>

      {/* ── Markdown rendered below for structure (headings, lists, code) ── */}
      {/* We render markdown in a separate layer that doesn't interfere with selection */}
      <div className="prose-dark mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-ink-500 text-xs mb-3 font-mono uppercase tracking-wider">Formatted view</p>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
      </div>
    </div>
  );
}
