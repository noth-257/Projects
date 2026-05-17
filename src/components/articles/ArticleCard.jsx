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
    if (!menuOpen) { setMovingTo(false); return; }
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('articleId', String(article.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const isLight = document.documentElement.style.getPropertyValue('--is-light') === '1';

  const menuStyle = {
    background: 'linear-gradient(135deg, #22253a, #1a1d2e)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
  };

  return (
    <article
      draggable onDragStart={handleDragStart}
      onClick={() => !renaming && setSelectedArticle(article)}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200"
      style={isSelected ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.12), rgba(155,109,255,0.1))',
        border: '1px solid rgba(91,141,238,0.3)',
      } : {
        background: 'var(--card-bg, rgba(255,255,255,0.04))',
        border: '1px solid var(--card-border, rgba(255,255,255,0.07))',
      }}
    >
      {article.pinned && (
        <div className="absolute top-3 left-3">
          <Pin size={9} style={{ color: 'var(--accent,#5b8dee)', transform: 'rotate(45deg)' }} />
        </div>
      )}

      {/* FIX #6: 3-dot menu — use position fixed for the portal to avoid clipping */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all
            ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ color: 'var(--text-muted,#9da4d4)', background: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <ContextMenu
            article={article}
            folders={folders}
            menuStyle={menuStyle}
            onClose={() => setMenuOpen(false)}
            onPin={async () => { setMenuOpen(false); await pinArticle(article.id); }}
            onRename={() => { setRenaming(true); setMenuOpen(false); }}
            onEdit={() => { openArticleModal(article); setMenuOpen(false); }}
            onExport={() => { exportArticle(article); setMenuOpen(false); }}
            onDelete={async () => { setMenuOpen(false); if (confirm('Delete this article?')) await deleteArticle(article.id); }}
            onMoveTo={async (fid) => { setMenuOpen(false); await moveArticleToFolder(article.id, fid); }}
          />
        )}
      </div>

      {renaming ? (
        <input autoFocus value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { renameArticle(article.id, renameVal.trim()); setRenaming(false); }
            if (e.key === 'Escape') setRenaming(false);
          }}
          onBlur={() => { renameArticle(article.id, renameVal.trim()); setRenaming(false); }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent border-b text-sm font-semibold font-display outline-none mb-2 pr-8"
          style={{ borderColor: 'var(--accent,#5b8dee)', color: 'var(--text-primary,#e8eaf6)' }} />
      ) : (
        <h3 className={`font-semibold text-sm leading-snug mb-2 font-display line-clamp-2 ${article.pinned ? 'pl-4' : 'pr-8'}`}
          style={{ color: 'var(--text-primary,#e8eaf6)' }}>
          {article.title || 'Untitled'}
        </h3>
      )}

      {!renaming && preview && (
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--text-muted,#64748b)' }}>{preview}</p>
      )}

      {!renaming && article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.tags.slice(0, 3).map((tag) => <Tag key={tag} label={tag} />)}
          {article.tags.length > 3 && <span className="text-xs" style={{ color: 'var(--text-muted,#64748b)' }}>+{article.tags.length - 3}</span>}
        </div>
      )}

      {!renaming && (
        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted,#64748b)' }}>
          {folder && <span className="flex items-center gap-1"><Folder size={9} />{folder.name}</span>}
          <span className="flex items-center gap-1 ml-auto"><Clock size={9} />{formatDate(article.updatedAt)}</span>
        </div>
      )}
    </article>
  );
}

// FIX #6: context menu as a separate component, absolutely positioned but with overflow visible
function ContextMenu({ article, folders, menuStyle, onClose, onPin, onRename, onEdit, onExport, onDelete, onMoveTo }) {
  const [movingTo, setMovingTo] = useState(false);

  return (
    <div className="absolute right-0 top-9 z-[999] w-52 rounded-2xl animate-scale-in"
      style={{ ...menuStyle, overflow: 'visible' }}
      onClick={(e) => e.stopPropagation()}>
      <div className="rounded-2xl overflow-hidden">
        <MI icon={<Pin size={13} />} label={article.pinned ? 'Unpin' : 'Pin article'} onClick={onPin} />
        <MI icon={<PenLine size={13} />} label="Rename" onClick={onRename} />
        <MI icon={<PenLine size={13} />} label="Edit" onClick={onEdit} />

        {/* FIX #6: Move to folder — submenu opens to the left to avoid going off-screen */}
        <div className="relative">
          <MI icon={<FolderInput size={13} />} label="Move to folder"
            onClick={() => setMovingTo((v) => !v)} hasArrow />
          {movingTo && (
            <div className="absolute top-0 right-full mr-1 w-48 rounded-xl z-[1000]"
              style={{ ...menuStyle, overflow: 'hidden' }}>
              <button onClick={() => { onMoveTo(null); setMovingTo(false); }}
                className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/8"
                style={{ color: '#9da4d4' }}>
                — No folder —
              </button>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
              {folders.map((f) => (
                <button key={f.id} onClick={() => { onMoveTo(f.id); setMovingTo(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/8"
                  style={{ color: '#9da4d4' }}>
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <MI icon={<Download size={13} />} label="Export .md" onClick={onExport} />
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
        <MI icon={<Trash2 size={13} />} label="Delete" onClick={onDelete} danger />
      </div>
    </div>
  );
}

function MI({ icon, label, onClick, danger, hasArrow }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
      style={{
        color: danger ? '#f87171' : '#c5c9e8',
        background: 'transparent',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <span style={{ color: danger ? '#f87171' : '#64748b' }}>{icon}</span>
      <span className="flex-1 text-left text-xs">{label}</span>
      {hasArrow && <span style={{ color: '#64748b' }}>‹</span>}
    </button>
  );
}
