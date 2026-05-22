import { useStore } from '../../store/useStore';
import { Database, Folder, FileText, Tag, Highlighter } from 'lucide-react';

/**
 * StatusBar — bottom strip showing live vault stats.
 * Highlight count is included here as the dashboard integration hook
 * for future AI/analytics features.
 */
export default function StatusBar() {
  const { articles, folders, highlights } = useStore();
  const tagSet = new Set(articles.flatMap((a) => a.tags || []));

  const stats = [
    { icon: <FileText size={12} />, label: 'Articles', value: articles.length },
    { icon: <Folder size={12} />, label: 'Folders', value: folders.length },
    { icon: <Tag size={12} />, label: 'Tags', value: tagSet.size },
    { icon: <Highlighter size={12} />, label: 'Highlights', value: highlights.length },
    { icon: <Database size={12} />, label: 'Storage', value: 'Local' },
  ];

  return (
    <div
      className="flex items-center justify-between px-6 py-2.5 border-t flex-shrink-0"
      style={{
        background: 'rgba(7,8,13,0.9)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-ink-500">
            <span>{s.icon}</span>
            <span className="font-mono font-medium text-ink-400">{s.value}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-600">
        <span className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#4ade80', boxShadow: '0 0 5px rgba(74,222,128,0.7)' }} />
        <span>Offline ready</span>
      </div>
    </div>
  );
}
