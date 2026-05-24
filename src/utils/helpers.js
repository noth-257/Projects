export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
}

export function getPreviewText(markdown, maxLen = 120) {
  if (!markdown) return '';
  const stripped = markdown
    .replace(/^---[\s\S]*?---\n/m, '')        // strip frontmatter
    .replace(/#{1,6}\s+/g, '')                 // headings
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')       // bold+italic
    .replace(/\*\*(.+?)\*\*/g, '$1')           // bold
    .replace(/\*(.+?)\*/g, '$1')               // italic
    .replace(/~~(.+?)~~/g, '$1')               // strikethrough
    .replace(/__(.+?)__/g, '$1')               // underline
    .replace(/`{3}[\s\S]*?`{3}/g, '')         // code blocks
    .replace(/`[^`]*`/g, '')                   // inline code
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1') // links + images
    .replace(/^>+\s*/gm, '')                   // blockquotes
    .replace(/^[-*+]\s+/gm, '')               // unordered list
    .replace(/^\d+\.\s+/gm, '')              // ordered list
    .replace(/^[-_*]{3,}$/gm, '')              // horizontal rules
    .replace(/\|[^\n]+\|/g, '')              // tables
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}
