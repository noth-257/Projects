import { useState } from 'react';
import { Trash2, ChevronDown, Highlighter } from 'lucide-react';
import { HIGHLIGHT_COLORS, COLOR_ORDER } from '../../utils/highlightUtils';
import { useStore } from '../../store/useStore';

/**
 * HighlightSidebar
 * Right panel listing all highlights grouped by color.
 * Clicking a highlight navigates to it in the reader.
 */
export default function HighlightSidebar({ onJumpTo }) {
  const { highlights, deleteHighlight, updateHighlightColor } = useStore();
  const [collapsed, setCollapsed] = useState({});

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(155,109,255,0.1)', border: '1px solid rgba(155,109,255,0.2)' }}>
          <Highlighter size={20} className="text-aurora-purple opacity-70" />
        </div>
        <p className="text-ink-300 text-sm font-medium mb-1">No highlights yet</p>
        <p className="text-ink-500 text-xs">Select text in the article to highlight it</p>
      </div>
    );
  }

  // Group by color
  const grouped = {};
  for (const colorId of COLOR_ORDER) {
    const group = highlights.filter((h) => h.color === colorId);
    if (group.length > 0) grouped[colorId] = group;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-semibold text-ink-200 font-display">Highlights</h3>
        <p className="text-ink-500 text-xs mt-0.5">{highlights.length} total</p>
      </div>

      <div className="flex-1 px-3 py-3 space-y-4">
        {Object.entries(grouped).map(([colorId, items]) => {
          const c = HIGHLIGHT_COLORS[colorId];
          const isCollapsed = collapsed[colorId];
          return (
            <div key={colorId}>
              {/* Group header */}
              <button
                onClick={() => setCollapsed((s) => ({ ...s, [colorId]: !s[colorId] }))}
                className="flex items-center gap-2 w-full mb-2 group"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                <span className="text-xs font-semibold text-ink-300 group-hover:text-ink-100 transition-colors flex-1 text-left">
                  {c.label}
                </span>
                <span className="text-[10px] text-ink-500 font-mono">{items.length}</span>
                <ChevronDown size={11} className="text-ink-500 transition-transform duration-200"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }} />
              </button>

              {/* Highlight cards */}
              {!isCollapsed && (
                <div className="space-y-1.5 pl-2">
                  {items.map((h) => (
                    <HighlightCard
                      key={h.id}
                      highlight={h}
                      color={c}
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

function HighlightCard({ highlight, color, onJump, onDelete, onColorChange }) {
  const [showColors, setShowColors] = useState(false);

  return (
    <div
      className="group rounded-xl p-3 cursor-pointer transition-all duration-150"
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
      onClick={onJump}
    >
      <p className="text-xs text-ink-100 leading-relaxed line-clamp-3 mb-2">
        "{highlight.selectedText}"
      </p>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Color dots to change color */}
        {COLOR_ORDER.map((cid) => (
          <button key={cid}
            onClick={(e) => { e.stopPropagation(); onColorChange(cid); }}
            className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125"
            style={{ background: HIGHLIGHT_COLORS[cid].dot }}
            title={HIGHLIGHT_COLORS[cid].label} />
        ))}
        <div className="flex-1" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
