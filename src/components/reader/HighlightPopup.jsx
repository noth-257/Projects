import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

/**
 * HighlightPopup — floating toolbar shown when text is selected.
 * B / I / U / S(trikethrough) | color dot ▾
 * FIX #5: Cut/copy/paste removed (browser handles via Ctrl+X/C/V natively).
 * FIX #2: Calls execCommand-based onFormat so formatting actually renders.
 * FIX #6: Color picker uses store's custom highlight colors.
 */
export default function HighlightPopup({ position, onSelect, onClose, onFormat, selectedColor }) {
  const ref = useRef(null);
  const { highlightColors, highlightColorOrder } = useStore();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const activeColor = selectedColor && highlightColors[selectedColor]
    ? highlightColors[selectedColor]
    : Object.values(highlightColors)[0];

  const sep = <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />;

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-2xl animate-scale-in select-none"
      style={{
        top: position.y - 58,
        left: position.x,
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(20,23,45,0.99), rgba(14,16,32,0.99))',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      }}
    >
      {/* Caret */}
      <div className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45"
        style={{ background: 'rgba(14,16,32,0.99)', borderRight: '1px solid rgba(255,255,255,0.13)', borderBottom: '1px solid rgba(255,255,255,0.13)' }} />

      {/* B */}
      <FmtBtn char="B" title="Bold (Ctrl+B)" weight={700} onClick={() => onFormat?.('bold')} />
      {/* I */}
      <FmtBtn char="I" title="Italic (Ctrl+I)" isItalic onClick={() => onFormat?.('italic')} />
      {/* U */}
      <FmtBtn char="U" title="Underline (Ctrl+U)" isUnderline onClick={() => onFormat?.('underline')} />
      {/* S strikethrough — FIX #5 */}
      <FmtBtn char="S" title="Strikethrough (Ctrl+Shift+S)" isStrike onClick={() => onFormat?.('strikethrough')} />

      {sep}

      {/* Color picker */}
      <ColorPicker
        activeColor={activeColor}
        highlightColors={highlightColors}
        highlightColorOrder={highlightColorOrder}
        onSelect={onSelect}
      />
    </div>
  );
}

function FmtBtn({ char, title, weight, isItalic, isUnderline, isStrike, onClick }) {
  return (
    <button onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-100 hover:text-white hover:bg-white/12 transition-all text-sm leading-none"
      style={{
        fontWeight: weight || 400,
        fontStyle: isItalic ? 'italic' : 'normal',
        textDecoration: isStrike ? 'line-through' : isUnderline ? 'underline' : 'none',
      }}>
      {char}
    </button>
  );
}

function ColorPicker({ activeColor, highlightColors, highlightColorOrder, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-xl hover:bg-white/10 transition-all"
        title="Highlight color">
        <span className="w-4 h-4 rounded-full"
          style={{ background: activeColor?.dot || '#fde047', boxShadow: `0 0 8px ${activeColor?.dot || '#fde047'}70` }} />
        <span className="text-ink-300 text-[10px] font-mono">▾</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 p-1.5 rounded-2xl flex flex-col gap-0.5 animate-scale-in z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(20,23,45,0.99), rgba(14,16,32,0.99))',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            minWidth: '150px',
          }}>
          {highlightColorOrder.map((cid) => {
            const c = highlightColors[cid];
            if (!c) return null;
            return (
              <button key={cid}
                onClick={() => { onSelect(cid); setOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/10 hover:text-white transition-all text-left"
                style={{ color: 'var(--text-secondary,#c5c9e8)' }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: c.dot, boxShadow: `0 0 5px ${c.dot}60` }} />
                {c.label}
              </button>
            );
          })}
          <div style={{ margin: '2px 4px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-white/8 transition-all"
            style={{ color: 'var(--text-muted,#64748b)' }}>
            <span className="w-3 h-3 rounded-full border flex-shrink-0" style={{ borderColor: 'var(--text-muted,#64748b)' }} />
            Remove highlight
          </button>
        </div>
      )}
    </div>
  );
}
