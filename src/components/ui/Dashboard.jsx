import { useStore } from '../../store/useStore';
import { Database, Folder, FileText, Tag } from 'lucide-react';

export default function Dashboard() {
  const { articles, folders } = useStore();
  const tagSet = new Set(articles.flatMap((a) => a.tags || []));

  const stats = [
    { icon: <FileText size={13} />, label: 'Articles', value: articles.length },
    { icon: <Folder size={13} />, label: 'Folders', value: folders.length },
    { icon: <Tag size={13} />, label: 'Tags', value: tagSet.size },
    { icon: <Database size={13} />, label: 'Storage', value: 'Local' },
  ];

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-t flex-shrink-0"
      style={{
        background: 'rgba(7,8,13,0.8)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-6">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-ink-400">
            <span className="text-ink-500">{s.icon}</span>
            <span className="font-mono font-medium text-ink-300">{s.value}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }}
        />
        <span>Offline ready</span>
      </div>
    </div>
  );
}
