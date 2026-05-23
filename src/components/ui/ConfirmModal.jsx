import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * ConfirmModal — replaces native browser confirm() with a styled warning dialog.
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *   // To show: setConfirmState({ title, message, onConfirm, danger })
 *   // In JSX: <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
 */
export default function ConfirmModal({ state, onClose }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!state) return;
    // Focus confirm button for keyboard accessibility
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 50);
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [state, onClose]);

  if (!state) return null;

  const { title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, danger = true } = state;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-sm rounded-2xl animate-scale-in overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(22,25,48,0.99), rgba(15,17,32,0.99))',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-muted,#64748b)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={15} />
        </button>

        <div className="px-6 pt-6 pb-5">
          {/* Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(91,141,238,0.15)',
                border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(91,141,238,0.3)'}`,
              }}>
              {danger
                ? <Trash2 size={18} style={{ color: '#ef4444' }} />
                : <AlertTriangle size={18} style={{ color: '#5b8dee' }} />
              }
            </div>
            <h2 className="font-semibold text-base font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>
              {title}
            </h2>
          </div>

          {/* Message */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted,#94a3b8)' }}>
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary,#c5c9e8)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all text-white"
              style={{
                background: danger
                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                  : 'linear-gradient(135deg, #5b8dee, #9b6dff)',
                boxShadow: danger ? '0 4px 12px rgba(220,38,38,0.35)' : '0 4px 12px rgba(91,141,238,0.35)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
