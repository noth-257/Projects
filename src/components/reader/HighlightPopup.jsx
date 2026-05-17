import { useEffect, useRef, useState } from 'react';
import { Scissors, Copy, Clipboard, ChevronDown } from 'lucide-react';
import { HIGHLIGHT_COLORS, COLOR_ORDER } from '../../utils/highlightUtils';

export default function HighlightPopup({ position, onSelect, onClose, onFormat, selectedColor }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const activeColor = selectedColor ? HIGHLIGHT_COLORS[selectedColor] : HIGHLIGHT_COLORS.yellow;

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

      {/* B I U */}
      <FmtBtn char="B" title="Bold (Ctrl+B)" weight={700} onClick={() => onFormat?.('bold')} />
      <FmtBtn char="I" title="Italic (Ctrl+I)" isItalic onClick={() => onFormat?.('italic')} />
      <FmtBtn char="U" title="Underline (Ctrl+U)" isUnderline onClick={() => onFormat?.('underline')} />

      {sep}

      {/* Cut / Copy / Paste */}
      <IcnBtn icon={<Scissors size={13} />} title="Cut" onClick={() => document.execCommand('cut')} />
      <IcnBtn icon={<Copy size={13} />} title="Copy" onClick={() => document.execCommand('copy')} />
      <IcnBtn icon={<Clipboard size={13} />} title="Paste" onClick={() => document.execCommand('paste')} />

      {sep}

      {/* Color picker */}
      <ColorPicker activeColor={activeColor} onSelect={onSelect} />
    </div>
  );
}

function FmtBtn({ char, title, weight, isItalic, isUnderline, onClick }) {
  return (
    <button onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-100 hover:text-white hover:bg-white/12 transition-all text-sm leading-none"
      style={{ fontWeight: weight || 400, fontStyle: isItalic ? 'italic' : 'normal', textDecoration: isUnderline ? 'underline' : 'none' }}>
      {char}
    </button>
  );
}

function IcnBtn({ icon, title, onClick }) {
  return (
    <button onClick={onClick} title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-300 hover:text-white hover:bg-white/12 transition-all">
      {icon}
    </button>
  );
}

function ColorPicker({ activeColor, onSelect }) {
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
        title="Highlight color"
      >
        <span className="w-4 h-4 rounded-full"
          style={{ background: activeColor.dot, boxShadow: `0 0 8px ${activeColor.dot}70` }} />
        <span className="text-ink-300 text-[10px] font-mono">▾</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 p-1.5 rounded-2xl flex flex-col gap-0.5 animate-scale-in z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(20,23,45,0.99), rgba(14,16,32,0.99))',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            minWidth: '140px',
          }}
        >
          {COLOR_ORDER.map((cid) => {
            const c = HIGHLIGHT_COLORS[cid];
            return (
              <button key={cid}
                onClick={() => { onSelect(cid); setOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-ink-200 hover:bg-white/10 hover:text-white transition-all text-left"
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: c.dot, boxShadow: `0 0 5px ${c.dot}60` }} />
                {c.label}
              </button>
            );
          })}
          <div style={{ margin: '2px 4px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-ink-500 hover:bg-white/8 hover:text-ink-300 transition-all"
          >
            <span className="w-3 h-3 rounded-full border border-ink-600 flex-shrink-0" />
            Remove highlight
          </button>
        </div>
      )}
    </div>
  );
}
