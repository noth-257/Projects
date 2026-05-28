/**
 * htmlToMarkdown
 * Converts the reader's contentEditable HTML back to markdown.
 * This is intentionally simple — covers the formatting we support.
 * Used to sync reader direct-edits back to the markdown source.
 */
export function htmlToMarkdown(html) {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove highlight marks — they are not part of content
  doc.querySelectorAll('mark[data-highlight-id]').forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;

    const tag = node.tagName?.toLowerCase();
    const children = Array.from(node.childNodes).map(processNode).join('');

    switch (tag) {
      case 'strong': case 'b': return `**${children}**`;
      case 'em':     case 'i': return `*${children}*`;
      case 's':  case 'strike': case 'del': return `~~${children}~~`;
      case 'u':  return `__${children}__`;
      case 'h1': return `# ${children}\n\n`;
      case 'h2': return `## ${children}\n\n`;
      case 'h3': return `### ${children}\n\n`;
      case 'h4': return `#### ${children}\n\n`;
      case 'h5': return `##### ${children}\n\n`;
      case 'h6': return `###### ${children}\n\n`;
      case 'p':  return `${children}\n\n`;
      case 'br': return '\n';
      case 'li': return `- ${children}\n`;
      case 'ul': case 'ol': return `${children}\n`;
      case 'blockquote': return children.split('\n').map(l => `> ${l}`).join('\n') + '\n\n';
      case 'code': {
        const parent = node.parentNode?.tagName?.toLowerCase();
        if (parent === 'pre') return children;
        return `\`${children}\``;
      }
      case 'pre': return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case 'a':  return `[${children}](${node.getAttribute('href') || ''})`;
      case 'hr': return `---\n\n`;
      case 'div': case 'section': case 'article':
        return children + (children.endsWith('\n') ? '' : '\n');
      default: return children;
    }
  }

  const result = processNode(doc.body)
    .replace(/\n{3,}/g, '\n\n')  // collapse triple+ newlines
    .trim();

  return result;
}
