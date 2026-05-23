import { useState } from 'react';
import { Trash2, ChevronDown, Highlighter } from 'lucide-react';
import { useStore } from '../../store/useStore';

/**
 * HighlightSidebar — lists all highlights for the current article,
 * grouped by color. showHeader=false when header is rendered by parent.
 * Uses store's highlightColors so custom colors work too.
 */
export default function HighlightSidebar({ onJumpTo, showHeader = true }) {
  const {
    highlights, deleteHighlight, updateHighlightColor,
    highlightColors, highlightColorOrder,
  } = useStore();

  const [collapsed, setCollapsed] = useState({});

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(155,109,255,0.1)', border: '1px solid rgba(155,109,255,0.2)' }}>
          <Highlighter size={20} style={{ color: '#a78bfa', opacity: 0.7 }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary,#c5c9e8)' }}>
          No highlights yet
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted,#64748b)' }}>
          Select text in the article to highlight it
        </p>
      </div>
    );
  }

  // Deduplicate by selectedText — keep the most recent highlight for each unique text
  const seen = new Set();
  const deduped = [...highlights].reverse().filter(h => {
    const key = h.selectedText?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).reverse();

  // Group deduplicated highlights by color, preserving custom color order
  const grouped = {};
  for (const colorId of highlightColorOrder) {
    const group = deduped.filter((h) => h.color === colorId);
    if (group.length > 0) grouped[colorId] = group;
  }
  // Also catch highlights with colors not in the order (edge case)
  for (const h of deduped) {
    if (!grouped[h.color]) grouped[h.color] = [];
    if (!grouped[h.color].includes(h)) grouped[h.color].push(h);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {showHeader && (
        <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
          <h3 className="text-sm font-semibold font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>
            Highlights
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted,#64748b)' }}>
            {deduped.length} total
          </p>
        </div>
      )}

      <div className="flex-1 px-3 py-3 space-y-4">
        {Object.entries(grouped).map(([colorId, items]) => {
          const c = highlightColors[colorId];
          if (!c) return null;
          const isCollapsed = collapsed[colorId];

          return (
            <div key={colorId}>
              <button
                onClick={() => setCollapsed((s) => ({ ...s, [colorId]: !s[colorId] }))}
                className="flex items-center gap-2 w-full mb-2 group">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                <span className="text-xs font-semibold flex-1 text-left transition-colors group-hover:opacity-80"
                  style={{ color: '#e8eaf6' }}>
                  {c.label}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted,#64748b)' }}>
                  {items.length}
                </span>
                <ChevronDown size={11} style={{ color: 'var(--text-muted,#64748b)', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5 pl-2">
                  {items.map((h) => (
                    <HighlightCard
                      key={h.id}
                      highlight={h}
                      color={c}
                      highlightColors={highlightColors}
                      highlightColorOrder={highlightColorOrder}
                      onJump={() => onJumpTo(h.id)}
                      onDelete={() => deleteHighlight(h.id)}
                      onColorChange={(newColor) => updateHighlightColor(h.id, newColor)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HighlightCard({ highlight, color, highlightColors, highlightColorOrder, onJump, onDelete, onColorChange }) {
  return (
    <div
      className="group rounded-xl p-3 cursor-pointer transition-all duration-150"
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
      onClick={onJump}>
      <p className="text-xs leading-relaxed line-clamp-3 mb-2" style={{ color: '#e8eaf6' }}>
        "{highlight.selectedText}"
      </p>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {highlightColorOrder.map((cid) => {
          const c = highlightColors[cid];
          if (!c) return null;
          return (
            <button key={cid}
              onClick={(e) => { e.stopPropagation(); onColorChange(cid); }}
              className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125"
              style={{ background: c.dot }}
              title={c.label} />
          );
        })}
        <div className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:bg-red-500/20 transition-colors">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
