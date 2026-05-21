import { useEffect, useRef, useState } from 'react';
import { Scissors, Copy, Clipboard, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function HighlightPopup({ position, onSelect, onClose, onFormat, onClipboard, selectedColor }) {
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

  const sep = <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />;

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-2xl animate-scale-in select-none"
      style={{
        top: position.y - 60,
        left: position.x,
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, rgba(18,21,42,0.99), rgba(12,14,28,0.99))',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.75)',
      }}
    >
      {/* Caret */}
      <div className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 rotate-45"
        style={{ background: 'rgba(12,14,28,0.99)', borderRight: '1px solid rgba(255,255,255,0.14)', borderBottom: '1px solid rgba(255,255,255,0.14)' }} />

      {/* B I U S — onMouseDown so selection stays when clicked */}
      <FmtBtn label="B" title="Bold (Ctrl+B)"              fmtStyle={{ fontWeight: 700 }}                      onMouseDown={() => onFormat?.('bold')} />
      <FmtBtn label="I" title="Italic (Ctrl+I)"            fmtStyle={{ fontStyle: 'italic' }}                  onMouseDown={() => onFormat?.('italic')} />
      <FmtBtn label="U" title="Underline (Ctrl+U)"         fmtStyle={{ textDecoration: 'underline' }}          onMouseDown={() => onFormat?.('underline')} />
      <FmtBtn label="S" title="Strikethrough (Ctrl+⇧+S)"  fmtStyle={{ textDecoration: 'line-through' }}       onMouseDown={() => onFormat?.('strikeThrough')} />

      {sep}

      {/* Cut / Copy / Paste */}
      <IcnBtn icon={<Scissors size={13} />} title="Cut (Ctrl+X)"   onMouseDown={() => onClipboard?.('cut')} />
      <IcnBtn icon={<Copy size={13} />}     title="Copy (Ctrl+C)"  onMouseDown={() => onClipboard?.('copy')} />
      <IcnBtn icon={<Clipboard size={13} />} title="Paste (Ctrl+V)" onMouseDown={() => onClipboard?.('paste')} />

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

function FmtBtn({ label, title, fmtStyle = {}, onMouseDown }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(); }}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-sm leading-none transition-all"
      style={{ color: 'rgba(255,255,255,0.85)', ...fmtStyle }}
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
          className="absolute bottom-full right-0 mb-2 p-1.5 rounded-2xl flex flex-col gap-0.5 animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, rgba(18,21,42,0.99), rgba(12,14,28,0.99))',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            minWidth: '155px',
            zIndex: 100,
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
