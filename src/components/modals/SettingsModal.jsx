import { useRef, useState } from 'react';
import { Download, Upload, Plus, Pencil, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import { useStore, THEMES } from '../../store/useStore';

export default function SettingsModal() {
  const {
    showSettings, setShowSettings, theme, setTheme,
    exportAllArticles, importMarkdownFile, selectedFolderId,
    highlightColors, highlightColorOrder, renameHighlightColor, addHighlightColor,
  } = useStore();

  const fileRef = useRef(null);
  const [editingColor, setEditingColor] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColor, setNewColor] = useState({ label: '', dot: '#a78bfa' });

  const handleImport = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await importMarkdownFile(f, selectedFolderId);
    e.target.value = '';
  };

  const startEdit = (cid) => { setEditingColor(cid); setEditLabel(highlightColors[cid]?.label || ''); };
  const saveEdit = () => {
    if (editingColor && editLabel.trim()) renameHighlightColor(editingColor, editLabel.trim());
    setEditingColor(null);
  };

  const handleAddColor = () => {
    if (!newColor.label.trim()) return;
    const id = newColor.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const dot = newColor.dot;
    // derive bg/border from dot
    const bg = dot + '40';
    const border = dot + '99';
    addHighlightColor(id, newColor.label.trim(), dot, bg, border);
    setNewColor({ label: '', dot: '#a78bfa' });
    setShowAddColor(false);
  };

  return (
    <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings" size="md">
      <div className="space-y-6">

        {/* Theme */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--ink-400,#9da4d4)' }}>Theme</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} onClick={() => setTheme(key)}
                className="relative p-3 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: t.bg === '#f5f6fa' ? '#f5f6fa' : t.bg,
                  border: theme === key ? `2px solid ${t.accent}` : '2px solid rgba(128,128,128,0.2)',
                  color: t.isLight ? '#1e293b' : '#e8eaf6',
                }}>
                <div className="flex gap-1 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent2 }} />
                </div>
                {t.label}
                {theme === key && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: t.accent }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight colors — FIX #7: add, rename */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ink-400,#9da4d4)' }}>
              Highlight Colors
            </h3>
            <button onClick={() => setShowAddColor((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
              style={{ background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.3)', color: '#5b8dee' }}>
              <Plus size={11} /> Add color
            </button>
          </div>

          {/* Add color form */}
          {showAddColor && (
            <div className="mb-3 p-3 rounded-xl space-y-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex gap-2">
                <input type="text" placeholder="Label (e.g. Favorites)" value={newColor.label}
                  onChange={(e) => setNewColor((c) => ({ ...c, label: e.target.value }))}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--ink-100,#e8eaf6)' }} />
                <input type="color" value={newColor.dot}
                  onChange={(e) => setNewColor((c) => ({ ...c, dot: e.target.value }))}
                  className="w-10 h-8 rounded-lg cursor-pointer border-0 outline-none p-0.5"
                  style={{ background: 'transparent' }} />
              </div>
              <button onClick={handleAddColor}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #5b8dee, #9b6dff)' }}>
                Add highlight color
              </button>
            </div>
          )}

          {/* Existing colors */}
          <div className="space-y-1.5">
            {highlightColorOrder.map((cid) => {
              const c = highlightColors[cid];
              if (!c) return null;
              return (
                <div key={cid} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                  {editingColor === cid ? (
                    <input autoFocus value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingColor(null); }}
                      className="flex-1 bg-transparent text-xs outline-none border-b"
                      style={{ borderColor: c.dot, color: 'var(--ink-100,#e8eaf6)' }} />
                  ) : (
                    <span className="flex-1 text-xs" style={{ color: 'var(--ink-200,#c5c9e8)' }}>{c.label}</span>
                  )}
                  {editingColor === cid ? (
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300 transition-colors"><Check size={13} /></button>
                  ) : (
                    <button onClick={() => startEdit(cid)} className="opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--ink-400,#9da4d4)' }}><Pencil size={11} /></button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Import / Export */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--ink-400,#9da4d4)' }}>
            Import / Export
          </h3>
          <div className="space-y-2">
            <button onClick={exportAllArticles}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ink-200,#c5c9e8)' }}>
              <Download size={15} style={{ color: '#5b8dee' }} /> Export all articles as .md
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--ink-200,#c5c9e8)' }}>
              <Upload size={15} style={{ color: '#a78bfa' }} /> Import .md files
            </button>
            <input ref={fileRef} type="file" accept=".md" multiple className="hidden" onChange={handleImport} />
          </div>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--ink-500,#64748b)' }}>
          All data stored locally · No cloud · No tracking
        </p>
      </div>
    </Modal>
  );
}
