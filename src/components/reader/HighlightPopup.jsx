import { useEffect, useRef, useState } from 'react';
import { Scissors, Copy, Clipboard, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

/**
 * HighlightPopup
 * Fix 1: Ctrl+V paste works via keyboard shortcut in ArticleReader
 * Fix 2: buttons only act if there's an active selection
 * Fix 4: color picker opens ABOVE or BELOW depending on space available
 */
export default function HighlightPopup({ position, onSelect, onClose, selectedColor }) {
  const ref = useRef(null);
  const { highlightColors, highlightColorOrder } = useStore();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const activeColor = (selectedColor && highlightColors[selectedColor])
    ? highlightColors[selectedColor]
    : Object.values(highlightColors)[0];

  const hasSelection = () => {
    const sel = window.getSelection();
    return sel && !sel.isCollapsed && sel.toString().trim().length > 0;
  };

  const fmt = (cmd) => {
    // Fix 2: only execute if there's an active selection
    if (!hasSelection() && ['cut', 'copy'].includes(cmd)) return;
    document.execCommand(cmd, false, null);
  };

  const sep = <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />;

  // Fix 4: position popup below text if it would go off-screen at top
  const spaceAbove = position.y;
  const popupHeight = 52;
  const showBelow = spaceAbove < popupHeight + 20;
  const topPos = showBelow ? position.y + 28 : position.y - 60;

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-2xl animate-scale-in select-none"
      style={{
        top: topPos,
        left: Math.max(180, Math.min(position.x, window.innerWidth - 180)),
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(18,21,42,0.99), rgba(12,14,28,0.99))',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.75)',
      }}
    >
      {/* Caret — points toward text */}
      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
        style={{
          [showBelow ? 'top' : 'bottom']: '-7px',
          background: 'rgba(12,14,28,0.99)',
          borderRight: showBelow ? 'none' : '1px solid rgba(255,255,255,0.14)',
          borderBottom: showBelow ? 'none' : '1px solid rgba(255,255,255,0.14)',
          borderLeft: showBelow ? '1px solid rgba(255,255,255,0.14)' : 'none',
          borderTop: showBelow ? '1px solid rgba(255,255,255,0.14)' : 'none',
        }} />

      {/* B I U S */}
      <FmtBtn label="B" title="Bold (Ctrl+B)"             style={{ fontWeight: 700 }}              onMouseDown={() => fmt('bold')} />
      <FmtBtn label="I" title="Italic (Ctrl+I)"            style={{ fontStyle: 'italic' }}          onMouseDown={() => fmt('italic')} />
      <FmtBtn label="U" title="Underline (Ctrl+U)"         style={{ textDecoration: 'underline' }}  onMouseDown={() => fmt('underline')} />
      <FmtBtn label="S" title="Strikethrough (Ctrl+Shift+S)" style={{ textDecoration: 'line-through' }} onMouseDown={() => fmt('strikeThrough')} />

      {sep}

      {/* Cut / Copy / Paste */}
      <IcnBtn icon={<Scissors size={13} />} title="Cut (Ctrl+X)"
        onMouseDown={() => fmt('cut')} />
      <IcnBtn icon={<Copy size={13} />} title="Copy (Ctrl+C)"
        onMouseDown={() => fmt('copy')} />
      {/* Fix 1: Paste uses clipboard API */}
      <IcnBtn icon={<Clipboard size={13} />} title="Paste (Ctrl+V)"
        onMouseDown={() => {
          navigator.clipboard.readText()
            .then((text) => document.execCommand('insertText', false, text))
            .catch(() => document.execCommand('paste', false, null));
        }} />

      {sep}

      {/* Highlight color picker — Fix 4: smart positioning */}
      <ColorPicker
        activeColor={activeColor}
        highlightColors={highlightColors}
        highlightColorOrder={highlightColorOrder}
        onSelect={onSelect}
        spaceAbove={spaceAbove}
        showBelow={showBelow}
      />
    </div>
  );
}

function FmtBtn({ label, title, style = {}, onMouseDown }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-sm leading-none transition-all"
      style={{ color: 'rgba(255,255,255,0.85)', ...style }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {label}
    </button>
  );
}

function IcnBtn({ icon, title, onMouseDown }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
      style={{ color: 'rgba(255,255,255,0.65)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
    >
      {icon}
    </button>
  );
}

function ColorPicker({ activeColor, highlightColors, highlightColorOrder, onSelect, showBelow }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  // Fix 4: dropdown opens in direction with more space
  const dropdownStyle = showBelow
    ? { top: 'calc(100% + 6px)', bottom: 'auto' }
    : { bottom: 'calc(100% + 6px)', top: 'auto' };

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        className="flex items-center gap-1 pl-1.5 pr-1.5 py-1 rounded-xl transition-all"
        style={{ color: 'rgba(255,255,255,0.65)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        title="Highlight color"
      >
        <span className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ background: activeColor?.dot || '#fde047', boxShadow: `0 0 8px ${activeColor?.dot || '#fde047'}80` }} />
        <ChevronDown size={10} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 p-1.5 rounded-2xl flex flex-col gap-0.5 animate-scale-in"
          style={{
            ...dropdownStyle,
            background: 'linear-gradient(135deg, rgba(18,21,42,0.99), rgba(12,14,28,0.99))',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            minWidth: '155px',
            zIndex: 200,
          }}
        >
          {highlightColorOrder.map((cid) => {
            const c = highlightColors[cid];
            if (!c) return null;
            return (
              <button key={cid}
                onMouseDown={(e) => { e.preventDefault(); onSelect(cid); setOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: c.dot, boxShadow: `0 0 5px ${c.dot}60` }} />
                {c.label}
              </button>
            );
          })}
          <div style={{ margin: '2px 4px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <button
            onMouseDown={(e) => { e.preventDefault(); onSelect(null); setOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <span className="w-3 h-3 rounded-full border flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
            Remove highlight
          </button>
        </div>
      )}
    </div>
  );
}
