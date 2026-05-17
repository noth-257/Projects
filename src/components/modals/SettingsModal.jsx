import { useRef } from 'react';
import { Sun, Moon, Palette, Download, Upload, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { useStore, THEMES } from '../../store/useStore';

export default function SettingsModal() {
  const { showSettings, setShowSettings, theme, setTheme, exportAllArticles, importMarkdownFile, selectedFolderId } = useStore();
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await importMarkdownFile(f, selectedFolderId);
    e.target.value = '';
  };

  return (
    <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" size="md">
      <div className="space-y-6">

        {/* Theme */}
        <div>
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Palette size={12} /> Theme
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className="relative p-3 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: t.bg,
                  border: theme === key ? `2px solid ${t.accent}` : '2px solid rgba(255,255,255,0.08)',
                  color: key === 'light' ? '#1e293b' : '#e8eaf6',
                }}
              >
                <div className="flex gap-1 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent2 }} />
                </div>
                {t.label}
                {theme === key && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: t.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Import / Export */}
        <div>
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Download size={12} /> Import / Export
          </h3>
          <div className="space-y-2">
            <button
              onClick={exportAllArticles}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-ink-200 hover:text-ink-100 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Download size={15} className="text-aurora-blue" />
              Export all articles as .md
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-ink-200 hover:text-ink-100 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Upload size={15} className="text-aurora-purple" />
              Import .md files
            </button>
            <input ref={fileRef} type="file" accept=".md" multiple className="hidden" onChange={handleImport} />
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-ink-500 text-center">
          All data stored locally in IndexedDB · No cloud · No tracking
        </div>
      </div>
    </Modal>
  );
}
