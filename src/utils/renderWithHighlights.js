import { marked } from 'marked';

/**
 * renderWithHighlights
 *
 * Converts markdown → HTML and injects highlight <mark> spans.
 *
 * OFFSET MODEL (fixes drift issue):
 * Offsets are computed in the reader against the contentEditable div's
 * textContent — which is the rendered HTML's text, NOT the raw markdown.
 * So we must walk text nodes of the rendered HTML to find the right positions,
 * which is exactly what this function does.
 *
 * The key insight: after marked.parse(), the HTML's textContent is what the
 * user sees and selects. Offsets recorded in the reader match this text.
 */
export function renderWithHighlights(markdown, highlights, highlightColors) {
  if (!markdown) return '';

  // 1. Render markdown → HTML
  const html = marked.parse(markdown, { breaks: true, gfm: true });
  if (!highlights || highlights.length === 0) return html;

  // 2. Sort and remove overlapping highlights (keep first occurrence)
  const sorted = [...highlights]
    .sort((a, b) => a.startOffset - b.startOffset)
    .reduce((acc, h) => {
      if (!acc.length || h.startOffset >= acc[acc.length - 1].endOffset) acc.push(h);
      return acc;
    }, []);

  // 3. Parse into a detached DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // 4. Walk ALL text nodes and record their absolute positions
  //    This is exactly what the browser does when the reader computes offsets
  const nodes = [];
  let pos = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    const len = n.textContent.length;
    if (len > 0) {
      nodes.push({ node: n, start: pos, end: pos + len });
      pos += len;
    }
  }

  // 5. Inject marks — process in reverse so mutations don't shift indices
  for (let hi = sorted.length - 1; hi >= 0; hi--) {
    const h = sorted[hi];
    const c = highlightColors[h.color];
    if (!c) continue;

    const hStart = h.startOffset;
    const hEnd   = h.endOffset;

    // Clamp to actual text length (prevents out-of-bounds on edited articles)
    const totalLen = pos;
    if (hStart >= totalLen || hEnd <= 0) continue;
    const clampedStart = Math.max(0, hStart);
    const clampedEnd   = Math.min(totalLen, hEnd);

    // All text nodes overlapping [clampedStart, clampedEnd), reversed
    const overlapping = nodes
      .filter(tn => tn.end > clampedStart && tn.start < clampedEnd)
      .reverse();

    for (const tn of overlapping) {
      const localStart = Math.max(0, clampedStart - tn.start);
      const localEnd   = Math.min(tn.node.textContent.length, clampedEnd - tn.start);
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

      const frag = doc.createDocumentFragment();
      if (before) frag.appendChild(doc.createTextNode(before));
      frag.appendChild(mark);
      if (after)  frag.appendChild(doc.createTextNode(after));
      parent.replaceChild(frag, tn.node);
    }
  }

  return body.innerHTML;
}

/**
 * getRenderedTextLength
 * Returns the total character length of the rendered text for a markdown string.
 * Used by the reader to validate highlight offsets after article edits.
 */
export function getRenderedTextLength(markdown) {
  if (!markdown) return 0;
  const html = marked.parse(markdown, { breaks: true, gfm: true });
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent.length;
}

/**
 * injectMarksIntoHTML
 * Takes an existing HTML string (which may have user bold/italic formatting)
 * and injects highlight <mark> spans on top of it.
 * Used when saving formattedContent so both formatting AND highlights persist.
 */
export function injectMarksIntoHTML(html, highlights, highlightColors) {
  if (!highlights || highlights.length === 0) return html;

  // Sort + deduplicate
  const sorted = [...highlights]
    .sort((a, b) => a.startOffset - b.startOffset)
    .reduce((acc, h) => {
      if (!acc.length || h.startOffset >= acc[acc.length - 1].endOffset) acc.push(h);
      return acc;
    }, []);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Remove any existing <mark> spans first (clean slate)
  body.querySelectorAll('mark[data-highlight-id]').forEach(m => {
    const parent = m.parentNode;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  });

  // Walk text nodes and record positions
  const nodes = [];
  let pos = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    const len = n.textContent.length;
    if (len > 0) { nodes.push({ node: n, start: pos, end: pos + len }); pos += len; }
  }

  // Inject marks in reverse
  for (let hi = sorted.length - 1; hi >= 0; hi--) {
    const h = sorted[hi];
    const c = highlightColors[h.color];
    if (!c) continue;

    const clampedStart = Math.max(0, h.startOffset);
    const clampedEnd   = Math.min(pos, h.endOffset);
    if (clampedStart >= clampedEnd) continue;

    const overlapping = nodes
      .filter(tn => tn.end > clampedStart && tn.start < clampedEnd)
      .reverse();

    for (const tn of overlapping) {
      const localStart = Math.max(0, clampedStart - tn.start);
      const localEnd   = Math.min(tn.node.textContent.length, clampedEnd - tn.start);
      if (localStart >= localEnd) continue;

      const text = tn.node.textContent;
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
      mark.textContent = text.slice(localStart, localEnd);

      const frag = doc.createDocumentFragment();
      const before = text.slice(0, localStart);
      const after  = text.slice(localEnd);
      if (before) frag.appendChild(doc.createTextNode(before));
      frag.appendChild(mark);
      if (after)  frag.appendChild(doc.createTextNode(after));
      tn.node.parentNode?.replaceChild(frag, tn.node);
    }
  }

  return body.innerHTML;
}
