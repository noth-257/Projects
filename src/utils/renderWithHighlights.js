import { marked } from 'marked';

/**
 * Renders markdown → HTML, then injects highlight <mark> spans.
 * Offsets are computed against the RENDERED text content (not raw markdown),
 * which matches how the reader computes them from the DOM.
 */
export function renderWithHighlights(markdown, highlights, highlightColors) {
  if (!markdown) return '';

  const html = marked.parse(markdown, { breaks: true, gfm: true });
  if (!highlights || highlights.length === 0) return html;

  // Sort + deduplicate overlapping highlights
  const sorted = [...highlights]
    .sort((a, b) => a.startOffset - b.startOffset)
    .reduce((acc, h) => {
      if (!acc.length || h.startOffset >= acc[acc.length - 1].endOffset) acc.push(h);
      return acc;
    }, []);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Collect text nodes with their absolute character positions
  const nodes = [];
  let pos = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    const len = n.textContent.length;
    if (len > 0) nodes.push({ node: n, start: pos, end: pos + len });
    pos += len;
  }

  // Process highlights in REVERSE so earlier node mutations don't shift indices
  for (let hi = sorted.length - 1; hi >= 0; hi--) {
    const h = sorted[hi];
    const c = highlightColors[h.color];
    if (!c) continue;

    const hStart = h.startOffset;
    const hEnd   = h.endOffset;

    // Find text nodes overlapping this highlight, in reverse DOM order
    const overlapping = nodes
      .filter(tn => tn.end > hStart && tn.start < hEnd)
      .reverse();

    for (const tn of overlapping) {
      const localStart = Math.max(0, hStart - tn.start);
      const localEnd   = Math.min(tn.node.textContent.length, hEnd - tn.start);
      if (localStart >= localEnd) continue;

      const text   = tn.node.textContent;
      const before = text.slice(0, localStart);
      const mid    = text.slice(localStart, localEnd);
      const after  = text.slice(localEnd);

      const mark = doc.createElement('mark');
      mark.dataset.highlightId    = String(h.id);
      mark.dataset.highlightColor = h.color;
      mark.style.cssText = [
        `background:${c.bg}`,
        `border-bottom:2px solid ${c.border}`,
        `border-radius:2px`,
        `padding:0 1px`,
        `color:inherit`,
        `display:inline`,
      ].join(';');
      mark.textContent = mid;

      const parent = tn.node.parentNode;
      if (!parent) continue;

      // Replace the original text node with before + mark + after
      const frag = doc.createDocumentFragment();
      if (before) frag.appendChild(doc.createTextNode(before));
      frag.appendChild(mark);
      if (after)  frag.appendChild(doc.createTextNode(after));
      parent.replaceChild(frag, tn.node);
    }
  }

  return body.innerHTML;
}
