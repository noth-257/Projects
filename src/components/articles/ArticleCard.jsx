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
  const menuRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('articleId', String(article.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <article
      ref={cardRef}
      draggable onDragStart={handleDragStart}
      onClick={() => !renaming && setSelectedArticle(article)}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200"
      style={isSelected ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.12), rgba(155,109,255,0.1))',
        border: '1px solid rgba(91,141,238,0.3)',
      } : {
        background: 'var(--card-bg,rgba(255,255,255,0.04))',
        border: '1px solid var(--card-border,rgba(255,255,255,0.07))',
      }}
    >
      {article.pinned && (
        <div className="absolute top-3 left-3">
          <Pin size={9} style={{ color: 'var(--accent,#5b8dee)', transform: 'rotate(45deg)' }} />
        </div>
      )}

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3" ref={menuRef} style={{ zIndex: 20 }}>
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

// FIX #5: ContextMenu — move-to-folder submenu rendered inline below the item
// instead of absolutely to the side, which was getting clipped
function ContextMenu({ article, folders, onClose, onPin, onRename, onEdit, onExport, onDelete, onMoveTo }) {
  const [showMove, setShowMove] = useState(false);

  const menuStyle = {
    background: 'linear-gradient(135deg, #22253a, #1a1d2e)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
    borderRadius: '16px',
    overflow: 'hidden',
    minWidth: '180px',
  };

  return (
    <div className="absolute right-0 top-9 animate-scale-in"
      style={{ ...menuStyle, zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}>

      <MI icon={<Pin size={13} />} label={article.pinned ? 'Unpin' : 'Pin article'} onClick={onPin} />
      <MI icon={<PenLine size={13} />} label="Rename" onClick={onRename} />
      <MI icon={<PenLine size={13} />} label="Edit" onClick={onEdit} />

      {/* FIX #5: Move to folder as inline expandable section — no side flyout */}
      <MI icon={<FolderInput size={13} />} label="Move to folder"
        onClick={() => setShowMove((v) => !v)} hasArrow isOpen={showMove} />

      {showMove && (
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={() => onMoveTo(null)}
            className="w-full text-left px-5 py-2 text-xs transition-colors"
            style={{ color: '#9da4d4' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            — No folder —
          </button>
          {folders.map((f) => (
            <button key={f.id} onClick={() => onMoveTo(f.id)}
              className="w-full text-left px-5 py-2 text-xs transition-colors flex items-center gap-2"
              style={{ color: '#9da4d4' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <Folder size={11} style={{ color: 'var(--accent,#5b8dee)', flexShrink: 0 }} />
              {f.name}
            </button>
          ))}
        </div>
      )}

      <MI icon={<Download size={13} />} label="Export .md" onClick={onExport} />
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
      <MI icon={<Trash2 size={13} />} label="Delete" onClick={onDelete} danger />
    </div>
  );
}

function MI({ icon, label, onClick, danger, hasArrow, isOpen }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
      style={{ color: danger ? '#f87171' : '#c5c9e8', background: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <span style={{ color: danger ? '#f87171' : '#64748b', flexShrink: 0 }}>{icon}</span>
      <span className="flex-1 text-left text-xs">{label}</span>
      {hasArrow && (
        <span style={{ color: '#64748b', fontSize: '10px', transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.15s' }}>›</span>
      )}
    </button>
  );
}
