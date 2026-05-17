import { useState, useRef, useEffect } from 'react';
import { Folder, Clock, MoreVertical, Pin, PenLine, FolderInput, Trash2, Download } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Tag from '../ui/Tag';
import { formatDate, getPreviewText } from '../../utils/helpers';

export default function ArticleCard({ article }) {
  const {
    setSelectedArticle, getFolderById, openArticleModal,
    selectedArticle, deleteArticle, pinArticle, renameArticle,
    moveArticleToFolder, folders, exportArticle,
  } = useStore();

  const folder = article.folderId ? getFolderById(article.folderId) : null;
  const isSelected = selectedArticle?.id === article.id;
  const preview = getPreviewText(article.content);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(article.title);
  const [movingTo, setMovingTo] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const handleRename = async () => {
    if (renameVal.trim()) await renameArticle(article.id, renameVal.trim());
    setRenaming(false); setMenuOpen(false);
  };
  const handleDelete = async () => { setMenuOpen(false); if (confirm('Delete this article?')) await deleteArticle(article.id); };
  const handlePin = async () => { setMenuOpen(false); await pinArticle(article.id); };
  const handleMoveTo = async (folderId) => {
    setMovingTo(false); setMenuOpen(false);
    await moveArticleToFolder(article.id, folderId);
  };

  // Drag source — HTML5 drag
  const handleDragStart = (e) => {
    e.dataTransfer.setData('articleId', String(article.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onClick={() => !renaming && setSelectedArticle(article)}
      className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-200
        ${isSelected ? 'shadow-glow-blue' : 'hover:shadow-glass-hover'}`}
      style={isSelected ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.12), rgba(155,109,255,0.1))',
        border: '1px solid rgba(91,141,238,0.3)',
      } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {article.pinned && (
        <div className="absolute top-3 left-3">
          <Pin size={9} className="text-aurora-blue" style={{ transform: 'rotate(45deg)' }} />
        </div>
      )}

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-100 hover:bg-white/10 transition-all
            ${menuOpen ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100'}`}>
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 z-50 w-48 rounded-2xl overflow-visible animate-scale-in"
            style={{ background: 'linear-gradient(135deg, #2a2d3e, #1e2130)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}>
            <MI icon={<Pin size={13} />} label={article.pinned ? 'Unpin' : 'Pin article'} onClick={handlePin} />
            <MI icon={<PenLine size={13} />} label="Rename" onClick={() => { setRenaming(true); setMenuOpen(false); }} />
            <MI icon={<PenLine size={13} />} label="Edit" onClick={() => { openArticleModal(article); setMenuOpen(false); }} />
            {/* Move to folder */}
            <div className="relative">
              <MI icon={<FolderInput size={13} />} label="Move to folder" onClick={() => setMovingTo((v) => !v)} hasArrow />
              {movingTo && (
                <div className="absolute left-full top-0 ml-1 w-48 rounded-xl overflow-hidden z-50"
                  style={{ background: 'linear-gradient(135deg, #2a2d3e, #1e2130)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
                  <button onClick={() => handleMoveTo(null)}
                    className="w-full text-left px-4 py-2.5 text-xs text-ink-300 hover:bg-white/8 hover:text-ink-100 transition-colors">
                    — No folder —
                  </button>
                  {folders.map((f) => (
                    <button key={f.id} onClick={() => handleMoveTo(f.id)}
                      className="w-full text-left px-4 py-2.5 text-xs text-ink-300 hover:bg-white/8 hover:text-ink-100 transition-colors">
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <MI icon={<Download size={13} />} label="Export .md" onClick={() => { exportArticle(article); setMenuOpen(false); }} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
            <MI icon={<Trash2 size={13} />} label="Delete" onClick={handleDelete} danger />
          </div>
        )}
      </div>

      {renaming ? (
        <input autoFocus value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
          onBlur={handleRename} onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent border-b text-ink-100 text-sm font-semibold font-display outline-none mb-2 pr-8"
          style={{ borderColor: 'rgba(91,141,238,0.5)' }} />
      ) : (
        <h3 className={`font-semibold text-ink-100 text-sm leading-snug mb-2 font-display line-clamp-2 ${article.pinned ? 'pl-4' : 'pr-8'}`}>
          {article.title || 'Untitled'}
        </h3>
      )}

      {!renaming && preview && <p className="text-ink-400 text-xs leading-relaxed mb-3 line-clamp-2">{preview}</p>}

      {!renaming && article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.tags.slice(0, 3).map((tag) => <Tag key={tag} label={tag} />)}
          {article.tags.length > 3 && <span className="text-ink-500 text-xs">+{article.tags.length - 3}</span>}
        </div>
      )}

      {!renaming && (
        <div className="flex items-center gap-3 text-[11px] text-ink-500">
          {folder && <span className="flex items-center gap-1"><Folder size={9} />{folder.name}</span>}
          <span className="flex items-center gap-1 ml-auto"><Clock size={9} />{formatDate(article.updatedAt)}</span>
        </div>
      )}
    </article>
  );
}

function MI({ icon, label, onClick, danger, hasArrow }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
        ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-ink-200 hover:bg-white/8 hover:text-ink-100'}`}>
      <span className={danger ? 'text-red-400' : 'text-ink-500'}>{icon}</span>
      <span className="flex-1 text-left text-xs">{label}</span>
      {hasArrow && <span className="text-ink-600 text-xs">›</span>}
    </button>
  );
}
