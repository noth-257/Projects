import { useState, useEffect, useRef } from 'react';
import { Plus, FolderPlus, FileText, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function FAB() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { openFolderModal, openArticleModal } = useStore();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFolderClick = () => { setOpen(false); openFolderModal(); };
  const handleArticleClick = () => { setOpen(false); openArticleModal(); };

  return (
    <div ref={ref} className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      {/* Popup menu */}
      {open && (
        <div className="flex flex-col gap-2 animate-slide-up">
          <FABOption
            icon={<FileText size={16} />}
            label="New Article"
            onClick={handleArticleClick}
            color="rgba(91,141,238,0.9)"
          />
          <FABOption
            icon={<FolderPlus size={16} />}
            label="New Folder"
            onClick={handleFolderClick}
            color="rgba(155,109,255,0.9)"
          />
        </div>
      )}

      {/* Main button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white
          transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open
            ? 'linear-gradient(135deg, #1a1f3a, #12152a)'
            : 'linear-gradient(135deg, #5b8dee, #9b6dff)',
          boxShadow: open
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(91,141,238,0.4)',
          border: open ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
      >
        <span
          className="transition-transform duration-300"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0)' }}
        >
          <Plus size={24} />
        </span>
      </button>
    </div>
  );
}

function FABOption({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium text-white
        transition-all duration-200 hover:scale-105 active:scale-95 self-end"
      style={{
        background: color,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      {label}
      <span className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/20">
        {icon}
      </span>
    </button>
  );
}
