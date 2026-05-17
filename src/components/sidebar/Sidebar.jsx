import { useState, useRef } from 'react';
import {
  BookOpen, FolderOpen, Folder, ChevronRight, ChevronDown,
  Settings, Hash, Trash2, Plus, PanelLeftClose,
  Highlighter, PanelRightClose, Download, Upload,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { HIGHLIGHT_COLORS, COLOR_ORDER } from '../../utils/highlightUtils';
import highlightService from '../../services/highlightService';

export default function Sidebar() {
  const {
    folders, selectedFolderId, expandedFolders,
    setSelectedFolder, toggleFolderExpand, deleteFolder, renameFolder,
    getArticleCount, articles, openFolderModal,
    sidebarCollapsed, toggleSidebar,
    foldersCollapsed, toggleFoldersSection,
    tagsCollapsed, toggleTagsSection,
    highlightsCollapsed, toggleHighlightsSection,
    setDashboardView, dashboardView,
    getRootFolders, getChildFolders,
    setShowSettings, dashboardVisible, toggleDashboard,
    highlights, deleteHighlight, updateHighlightColor,
    exportAllArticles, importMarkdownFile, selectedFolderId: selFid,
  } = useStore();

  const fileRef = useRef(null);
  const handleImport = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await importMarkdownFile(f, selFid);
    e.target.value = '';
  };

  if (sidebarCollapsed) {
    return (
      <aside className="h-full flex flex-col items-center pt-3 pb-4 border-r"
        style={{ width: '64px', background: 'var(--sidebar-bg, rgba(13,15,26,0.97))', borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={toggleSidebar}
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #5b8dee, #9b6dff)' }} title="Expand sidebar">
          <BookOpen size={18} className="text-white" />
        </button>
        <div className="w-8 my-2" style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <CIBtn icon={<BookOpen size={15} />} active={dashboardView === 'articles' && selectedFolderId === null}
          onClick={() => { setSelectedFolder(null); setDashboardView('articles'); }} title="All Articles" />
        <CIBtn icon={<Folder size={15} />} active={dashboardView === 'folders'}
          onClick={() => setDashboardView('folders')} title="Folders" />
        <CIBtn icon={<Hash size={15} />} active={dashboardView === 'tags'}
          onClick={() => setDashboardView('tags')} title="Tags" />
        <CIBtn icon={<Highlighter size={15} />} active={dashboardView === 'highlights'}
          onClick={() => setDashboardView('highlights')} title="Highlights" />
        <div className="flex-1" />
        <CIBtn icon={<PanelRightClose size={15} />} onClick={toggleDashboard} title="Toggle dashboard"
          active={!dashboardVisible} />
        <button onClick={() => useStore.getState().openArticleModal()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 text-white hover:opacity-90 hover:scale-105 transition-all"
          style={{ background: 'linear-gradient(135deg, #5b8dee, #9b6dff)', boxShadow: '0 4px 16px rgba(91,141,238,0.35)' }}
          title="New Article">
          <Plus size={18} />
        </button>
        <CIBtn icon={<Settings size={15} />} onClick={() => setShowSettings(true)} title="Settings" />
      </aside>
    );
  }

  const rootFolders = getRootFolders();

  return (
    <aside className="h-full flex flex-col border-r"
      style={{ width: '256px', background: 'var(--sidebar-bg, rgba(13,15,26,0.97))', borderColor: 'rgba(255,255,255,0.06)' }}>

      {/* Header */}
      <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5b8dee, #9b6dff)' }}>
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-ink-100 leading-none font-display text-base">ArticleVault</h1>
            <p className="text-ink-500 text-[9px] mt-0.5 font-mono tracking-wider uppercase">Offline First</p>
          </div>
        </div>
        <button onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-500 hover:text-ink-200 hover:bg-white/8 transition-all"
          title="Collapse sidebar">
          <PanelLeftClose size={15} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">
        {/* All Articles */}
        <NavItem icon={<BookOpen size={14} />} label="All Articles" count={articles.length}
          active={selectedFolderId === null && dashboardView === 'articles'}
          onClick={() => { setSelectedFolder(null); setDashboardView('articles'); }} />

        {/* Folders */}
        <div className="pt-3">
          <SecHeader label="Folders" collapsed={foldersCollapsed}
            onToggle={() => { toggleFoldersSection(); setDashboardView('folders'); }}
            onAdd={() => openFolderModal(null)} />
          {!foldersCollapsed && (
            <div className="mt-1 space-y-0.5">
              {rootFolders.length === 0
                ? <p className="text-ink-600 text-xs px-3 py-1 italic">No folders yet</p>
                : rootFolders.map((f) => (
                  <FolderTree key={f.id} folder={f} depth={0}
                    selectedFolderId={selectedFolderId}
                    expandedFolders={expandedFolders}
                    getChildFolders={getChildFolders}
                    getArticleCount={getArticleCount}
                    onSelect={(id) => { setSelectedFolder(id); setDashboardView('articles'); }}
                    onToggle={toggleFolderExpand}
                    onDelete={deleteFolder}
                    onRename={renameFolder}
                    onAddChild={(id) => openFolderModal(id)}
                    articles={articles}
                  />
                ))
              }
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="pt-3">
          <SecHeader label="Tags" collapsed={tagsCollapsed} onToggle={toggleTagsSection} />
          {!tagsCollapsed && (
            <div className="mt-1">
              <NavItem icon={<Hash size={14} />} label="All Tags"
                active={dashboardView === 'tags'}
                onClick={() => setDashboardView('tags')} />
            </div>
          )}
        </div>

        {/* Highlights */}
        <div className="pt-3">
          <SecHeader label="Highlights" collapsed={highlightsCollapsed} onToggle={toggleHighlightsSection} />
          {!highlightsCollapsed && (
            <div className="mt-1 space-y-1">
              <NavItem icon={<Highlighter size={14} />} label="All Highlights"
                active={dashboardView === 'highlights'}
                onClick={() => setDashboardView('highlights')} />
              {/* Mini color groups */}
              {COLOR_ORDER.map((cid) => {
                const c = HIGHLIGHT_COLORS[cid];
                const count = highlights.filter((h) => h.color === cid).length;
                if (count === 0) return null;
                return (
                  <button key={cid}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-ink-400 hover:text-ink-200 hover:bg-white/5 transition-all"
                    style={{ border: '1px solid transparent' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                    {c.label}
                    <span className="ml-auto text-[10px] font-mono text-ink-600">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <NavItem icon={<PanelRightClose size={14} />} label={dashboardVisible ? 'Hide Dashboard' : 'Show Dashboard'}
          onClick={toggleDashboard} />
        <NavItem icon={<Download size={14} />} label="Export All" onClick={exportAllArticles} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink-300 hover:text-ink-100 transition-all"
          style={{ border: '1px solid transparent' }}>
          <Upload size={14} className="text-ink-500" />
          Import .md
        </button>
        <input ref={fileRef} type="file" accept=".md" multiple className="hidden" onChange={handleImport} />
        <NavItem icon={<Settings size={14} />} label="Settings" onClick={() => setShowSettings(true)} />
      </div>
    </aside>
  );
}

// ── Recursive folder tree ──────────────────────────────────────
function FolderTree({ folder, depth, selectedFolderId, expandedFolders, getChildFolders,
  getArticleCount, onSelect, onToggle, onDelete, onRename, onAddChild, articles }) {
  const children = getChildFolders(folder.id);
  const isActive = selectedFolderId === folder.id;
  const isExpanded = expandedFolders[folder.id];
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(folder.name);
  const count = getArticleCount(folder.id);

  // Drag target — drop article onto folder
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = async (e) => {
    e.preventDefault();
    const articleId = e.dataTransfer.getData('articleId');
    if (articleId) await useStore.getState().moveArticleToFolder(Number(articleId), folder.id);
  };

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-sm transition-all cursor-pointer group
          ${isActive ? 'text-ink-100 font-medium' : 'text-ink-300 hover:text-ink-100'}`}
        style={isActive ? {
          background: 'linear-gradient(135deg, rgba(91,141,238,0.15), rgba(155,109,255,0.15))',
          border: '1px solid rgba(91,141,238,0.2)',
        } : { border: '1px solid transparent' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Expand toggle */}
        <button onClick={() => onToggle(folder.id)}
          className="w-4 h-4 flex items-center justify-center text-ink-600 hover:text-ink-300 flex-shrink-0">
          {children.length > 0
            ? <ChevronRight size={10} style={{ transform: isExpanded ? 'rotate(90deg)' : '' }} className="transition-transform" />
            : <span className="w-1 h-1 rounded-full bg-ink-700" />
          }
        </button>

        {/* Folder icon + name */}
        <button onClick={() => onSelect(folder.id)} className="flex-1 flex items-center gap-1.5 min-w-0">
          {isActive ? <FolderOpen size={13} className="text-aurora-blue flex-shrink-0" />
            : <Folder size={13} className="text-ink-500 group-hover:text-ink-300 flex-shrink-0" />}
          {renaming ? (
            <input autoFocus value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onRename(folder.id, renameVal.trim()); setRenaming(false); }
                if (e.key === 'Escape') setRenaming(false);
              }}
              onBlur={() => { onRename(folder.id, renameVal.trim()); setRenaming(false); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-b text-xs text-ink-100 outline-none"
              style={{ borderColor: 'rgba(91,141,238,0.4)' }} />
          ) : (
            <span className="truncate text-sm" onDoubleClick={() => setRenaming(true)}>{folder.name}</span>
          )}
        </button>

        {/* Actions */}
        <div className={`flex items-center gap-0.5 flex-shrink-0 ${hovered ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          <button onClick={(e) => { e.stopPropagation(); onAddChild(folder.id); }}
            className="w-4 h-4 flex items-center justify-center rounded text-ink-500 hover:text-aurora-blue transition-colors" title="Add subfolder">
            <Plus size={9} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
            className="w-4 h-4 flex items-center justify-center rounded text-ink-600 hover:text-red-400 transition-colors">
            <Trash2 size={9} />
          </button>
        </div>
        <span className="text-[10px] font-mono text-ink-600 flex-shrink-0">{count}</span>
      </div>

      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div className="mt-0.5">
          {children.map((child) => (
            <FolderTree key={child.id} folder={child} depth={depth + 1}
              selectedFolderId={selectedFolderId} expandedFolders={expandedFolders}
              getChildFolders={getChildFolders} getArticleCount={getArticleCount}
              onSelect={onSelect} onToggle={onToggle} onDelete={onDelete}
              onRename={onRename} onAddChild={onAddChild} articles={articles} />
          ))}
        </div>
      )}
    </div>
  );
}

function SecHeader({ label, collapsed, onToggle, onAdd }) {
  return (
    <div className="flex items-center justify-between px-2 mb-0.5">
      <button onClick={onToggle} className="flex items-center gap-1.5 text-ink-500 hover:text-ink-300 transition-colors group">
        <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
        <ChevronDown size={10} className="transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }} />
      </button>
      {onAdd && (
        <button onClick={onAdd} className="w-5 h-5 flex items-center justify-center rounded text-ink-600 hover:text-aurora-blue transition-colors">
          <Plus size={11} />
        </button>
      )}
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group
        ${active ? 'text-ink-100 font-medium' : 'text-ink-300 hover:text-ink-100'}`}
      style={active ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.15), rgba(155,109,255,0.15))',
        border: '1px solid rgba(91,141,238,0.2)',
      } : { border: '1px solid transparent' }}>
      <span className="flex items-center gap-2.5">
        <span className={active ? 'text-aurora-blue' : 'text-ink-600 group-hover:text-ink-400'}>{icon}</span>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
          style={{ background: 'rgba(255,255,255,0.07)', color: '#9da4d4' }}>{count}</span>
      )}
    </button>
  );
}

function CIBtn({ icon, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-all
        ${active ? 'text-aurora-blue' : 'text-ink-500 hover:text-ink-200 hover:bg-white/5'}`}
      style={active ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.2), rgba(155,109,255,0.2))',
        border: '1px solid rgba(91,141,238,0.3)',
      } : { border: '1px solid transparent' }}>
      {icon}
    </button>
  );
}
