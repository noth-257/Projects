// Re-exports from store so components import from one place
export { DEFAULT_HIGHLIGHT_COLORS as HIGHLIGHT_COLORS, DEFAULT_COLOR_ORDER as COLOR_ORDER } from '../store/useStore';

export function buildSegments(plainText, highlights) {
  if (!highlights?.length) return [{ text: plainText, highlight: null }];
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const deduped = [];
  let lastEnd = 0;
  for (const h of sorted) { if (h.startOffset >= lastEnd) { deduped.push(h); lastEnd = h.endOffset; } }
  const segs = [];
  let cursor = 0;
  for (const h of deduped) {
    const s = Math.max(0, h.startOffset), e = Math.min(plainText.length, h.endOffset);
    if (s > cursor) segs.push({ text: plainText.slice(cursor, s), highlight: null });
    if (e > s) segs.push({ text: plainText.slice(s, e), highlight: h });
    cursor = e;
  }
  if (cursor < plainText.length) segs.push({ text: plainText.slice(cursor), highlight: null });
  return segs;
}
