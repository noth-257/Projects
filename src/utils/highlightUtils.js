/**
 * highlightUtils.js
 * Pure functions for highlight color metadata and text-offset logic.
 * No DOM side effects here — keeps utilities testable.
 */

export const HIGHLIGHT_COLORS = {
  yellow: {
    id: 'yellow',
    label: 'Important',
    bg: 'rgba(253,224,71,0.35)',
    border: 'rgba(253,224,71,0.6)',
    dot: '#fde047',
    text: '#854d0e',
  },
  red: {
    id: 'red',
    label: 'Problems',
    bg: 'rgba(248,113,113,0.3)',
    border: 'rgba(248,113,113,0.6)',
    dot: '#f87171',
    text: '#7f1d1d',
  },
  green: {
    id: 'green',
    label: 'Definitions',
    bg: 'rgba(74,222,128,0.25)',
    border: 'rgba(74,222,128,0.5)',
    dot: '#4ade80',
    text: '#14532d',
  },
  blue: {
    id: 'blue',
    label: 'Quotes',
    bg: 'rgba(96,165,250,0.28)',
    border: 'rgba(96,165,250,0.55)',
    dot: '#60a5fa',
    text: '#1e3a5f',
  },
  purple: {
    id: 'purple',
    label: 'Ideas',
    bg: 'rgba(167,139,250,0.28)',
    border: 'rgba(167,139,250,0.55)',
    dot: '#a78bfa',
    text: '#2e1065',
  },
};

export const COLOR_ORDER = ['yellow', 'red', 'green', 'blue', 'purple'];

/**
 * Get text offset of a selection within a container element.
 * Returns { startOffset, endOffset } relative to container's full textContent.
 */
export function getSelectionOffsets(containerEl) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;

  const range = sel.getRangeAt(0);
  if (!containerEl.contains(range.commonAncestorContainer)) return null;

  const preRange = document.createRange();
  preRange.selectNodeContents(containerEl);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + range.toString().length;

  return { startOffset, endOffset, selectedText: range.toString().trim() };
}

/**
 * Given article plain-text and an array of highlights (sorted by startOffset),
 * return an array of segments: { text, highlightId?, color? }
 * Used by HighlightedContent to render spans.
 */
export function buildSegments(plainText, highlights) {
  if (!highlights || highlights.length === 0) {
    return [{ text: plainText, highlightId: null, color: null }];
  }

  const segments = [];
  let cursor = 0;

  // Sort and deduplicate overlapping highlights (first one wins)
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const nonOverlapping = [];
  let lastEnd = 0;
  for (const h of sorted) {
    if (h.startOffset >= lastEnd) {
      nonOverlapping.push(h);
      lastEnd = h.endOffset;
    }
  }

  for (const h of nonOverlapping) {
    const start = Math.max(0, h.startOffset);
    const end = Math.min(plainText.length, h.endOffset);
    if (start > cursor) {
      segments.push({ text: plainText.slice(cursor, start), highlightId: null, color: null });
    }
    if (end > start) {
      segments.push({ text: plainText.slice(start, end), highlightId: h.id, color: h.color });
    }
    cursor = end;
  }

  if (cursor < plainText.length) {
    segments.push({ text: plainText.slice(cursor), highlightId: null, color: null });
  }

  return segments;
}
