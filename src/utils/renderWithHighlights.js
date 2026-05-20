import { marked } from 'marked';

/**
 * Converts markdown to HTML string with highlight <mark> spans injected.
 * Uses DOMParser so it works without a real DOM (browser only).
 */
export function renderWithHighlights(markdown, highlights, highlightColors) {
  if (!markdown) return '';

  // Render markdown → HTML
  const html = marked.parse(markdown, { breaks: true, gfm: true });
  if (!highlights || highlights.length === 0) return html;

  // Sort + remove overlaps
  const sorted = [...highlights]
    .sort((a, b) => a.startOffset - b.startOffset)
    .reduce((acc, h) => {
      if (!acc.length || h.startOffset >= acc[acc.length - 1].endOffset) acc.push(h);
      return acc;
    }, []);

  // Parse into a detached DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Collect all text nodes with absolute offsets into full textContent
  const nodes = [];
  let pos = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    nodes.push({ node: n, start: pos, end: pos + n.textContent.length });
    pos += n.textContent.length;
  }

  // Inject marks — process in reverse to keep earlier offsets stable
  for (let hi = sorted.length - 1; hi >= 0; hi--) {
    const h = sorted[hi];
    const c = highlightColors[h.color];
    if (!c) continue;

    // Find overlapping text nodes (reverse order)
    const overlapping = nodes
      .filter((tn) => tn.end > h.startOffset && tn.start < h.endOffset)
      .reverse();

    for (const tn of overlapping) {
      const localStart = Math.max(0, h.startOffset - tn.start);
      const localEnd   = Math.min(tn.node.textContent.length, h.endOffset - tn.start);
      if (localStart >= localEnd) continue;

      const text   = tn.node.textContent;
      const before = text.slice(0, localStart);
      const mid    = text.slice(localStart, localEnd);
      const after  = text.slice(localEnd);

      const mark = doc.createElement('mark');
      mark.dataset.highlightId    = String(h.id);
      mark.dataset.highlightColor = h.color;
      mark.style.cssText = `
        background:${c.bg};
        border-bottom:2px solid ${c.border};
        border-radius:2px;
        padding:0 2px;
        color:inherit;
      `;
      mark.textContent = mid;

      const parent = tn.node.parentNode;
      if (!parent) continue;

      const ref = tn.node.nextSibling;
      parent.removeChild(tn.node);
      if (after)  parent.insertBefore(doc.createTextNode(after), ref);
      parent.insertBefore(mark, after ? mark.nextSibling : ref);
      if (before) parent.insertBefore(doc.createTextNode(before), mark);
    }
  }

  return body.innerHTML;
}
