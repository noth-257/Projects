import { useState, useRef } from 'react';
import {
  BookOpen, FolderOpen, Folder, ChevronDown, ChevronRight,
  Settings, Hash, Trash2, Plus, PanelLeftClose,
  Highlighter, Download, Upload, FileText, PenLine,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function Sidebar() {
  const {
    folders, expandedFolders,
    toggleFolderExpand, deleteFolder, renameFolder,
    getArticleCount, getArticleCountDeep, articles, openFolderModal, openArticleModal,
    sidebarCollapsed, toggleSidebar, toggleDashboard,
    foldersCollapsed, toggleFoldersSection,
    tagsCollapsed, toggleTagsSection,
    highlightsCollapsed, toggleHighlightsSection,
    dashboardMode, setDashboardMode,
    currentFolderId, browseFolder, openFolderArticles, showFolderBrowser,
    getRootFolders, getChildFolders,
    setShowSettings, highlights,
    highlightColors, highlightColorOrder,
    exportAllArticles, importMarkdownFile,
    dashboardVisible, ensureDashboardVisible,
  } = useStore();

  const fileRef = useRef(null);
  const handleImport = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await importMarkdownFile(f, currentFolderId);
    e.target.value = '';
  };

  // ── COLLAPSED VIEW ─────────────────────────────────────────
  if (sidebarCollapsed) {
    return (
      <aside className="h-full flex flex-col items-center pt-3 pb-4 border-r"
        style={{ width: '64px', background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>

        {/* Logo — expands sidebar */}
        <button onClick={toggleSidebar}
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, var(--accent,#5b8dee), var(--accent2,#9b6dff))' }}
          title="Expand sidebar">
          <BookOpen size={18} className="text-white" />
        </button>

        <div className="w-8 mb-3" style={{ height: '1px', background: 'var(--sidebar-border,rgba(255,255,255,0.08))' }} />

        {/* All Articles */}
        <CIBtn icon={<BookOpen size={15} />} title="All Articles"
          active={dashboardMode === 'articles' && !currentFolderId && dashboardVisible}
          onClick={() => {
            if (dashboardMode === 'articles' && !currentFolderId && dashboardVisible) toggleDashboard();
            else { ensureDashboardVisible(); setDashboardMode('articles'); }
          }} />

        {/* Folders */}
        <CIBtn icon={<Folder size={15} />} title="Folders"
          active={dashboardMode === 'folders' && dashboardVisible}
          onClick={() => {
            if (dashboardMode === 'folders' && dashboardVisible) toggleDashboard();
            else showFolderBrowser();
          }} />

        {/* Tags */}
        <CIBtn icon={<Hash size={15} />} title="Tags"
          active={dashboardMode === 'tags' && dashboardVisible}
          onClick={() => {
            if (dashboardMode === 'tags' && dashboardVisible) toggleDashboard();
            else { ensureDashboardVisible(); setDashboardMode('tags'); }
          }} />

        {/* Highlights */}
        <CIBtn icon={<Highlighter size={15} />} title="Highlights"
          active={dashboardMode === 'highlights' && dashboardVisible}
          onClick={() => {
            if (dashboardMode === 'highlights' && dashboardVisible) toggleDashboard();
            else { ensureDashboardVisible(); setDashboardMode('highlights'); }
          }} />

        <div className="flex-1" />

        {/* FIX #4: New Article button — positioned like reference image, above settings */}
        <button onClick={() => openArticleModal()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 text-white hover:scale-105 transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--accent,#5b8dee), var(--accent2,#9b6dff))',
            boxShadow: '0 4px 16px rgba(91,141,238,0.3)',
          }}
          title="New Article">
          <Plus size={18} />
        </button>

        <CIBtn icon={<Settings size={15} />} onClick={() => setShowSettings(true)} title="Settings" />
      </aside>
    );
  }

  // ── EXPANDED VIEW ──────────────────────────────────────────
  const rootFolders = getRootFolders();

  return (
    <aside className="h-full flex flex-col border-r"
      style={{ width: '256px', background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>

      {/* Header */}
      <div className="px-4 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
        <button onClick={toggleSidebar} className="flex items-center gap-3 group" title="Collapse sidebar">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:opacity-80 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--accent,#5b8dee), var(--accent2,#9b6dff))' }}>
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold leading-none font-display text-base" style={{ color: 'var(--text-primary,#e8eaf6)' }}>ArticleVault</h1>
            <p className="text-[9px] mt-0.5 font-mono tracking-wider uppercase" style={{ color: 'var(--text-muted,#64748b)' }}>Offline First</p>
          </div>
        </button>
        <button onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-black/10"
          style={{ color: 'var(--text-muted,#64748b)' }}>
          <PanelLeftClose size={15} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">

        {/* All Articles */}
        <NavItem icon={<BookOpen size={14} />} label="All Articles" count={articles.length}
          active={dashboardMode === 'articles' && !currentFolderId}
          onClick={() => { ensureDashboardVisible(); setDashboardMode('articles'); }} />

        {/* FOLDERS — FIX #2: heading click shows root folder list */}
        <div className="pt-3">
          <SecHeader label="Folders" collapsed={foldersCollapsed}
            onToggle={() => {
              toggleFoldersSection();
              // Always show the folder browser when clicking Folders heading
              // regardless of whether it was collapsed or expanded
              showFolderBrowser();
            }} />
          {!foldersCollapsed && (
            <div className="mt-1 space-y-0.5">
              {rootFolders.length === 0
                ? <p className="text-xs px-3 py-1 italic" style={{ color: 'var(--text-muted,#64748b)' }}>No folders yet</p>
                : rootFolders.map((f) => (
                  <FolderTree key={f.id} folder={f} depth={0}
                    currentFolderId={currentFolderId}
                    expandedFolders={expandedFolders}
                    getChildFolders={getChildFolders}
                    getArticleCount={getArticleCount}
                    getArticleCountDeep={getArticleCountDeep}
                    onBrowse={(id) => { ensureDashboardVisible(); browseFolder(id); }}
                    onOpenArticles={(id) => { ensureDashboardVisible(); openFolderArticles(id); }}
                    onToggle={toggleFolderExpand}
                    onDelete={deleteFolder}
                    onRename={renameFolder}
                    onAddChild={(id) => openFolderModal(id)}
                  />
                ))
              }
            </div>
          )}
        </div>

        {/* TAGS */}
        <div className="pt-3">
          <SecHeader label="Tags" collapsed={tagsCollapsed}
            onToggle={() => {
              toggleTagsSection();
              ensureDashboardVisible();
              setDashboardMode(dashboardMode === 'tags' ? 'folders' : 'tags');
            }} />
          {!tagsCollapsed && (
            <div className="mt-1">
              <NavItem icon={<Hash size={14} />} label="All Tags"
                active={dashboardMode === 'tags'}
                onClick={() => { ensureDashboardVisible(); setDashboardMode(dashboardMode === 'tags' ? 'folders' : 'tags'); }} />
            </div>
          )}
        </div>

        {/* HIGHLIGHTS */}
        <div className="pt-3">
          <SecHeader label="Highlights" collapsed={highlightsCollapsed}
            onToggle={() => {
              toggleHighlightsSection();
              ensureDashboardVisible();
              setDashboardMode(dashboardMode === 'highlights' ? 'folders' : 'highlights');
            }} />
          {!highlightsCollapsed && (
            <div className="mt-1 space-y-0.5">
              <NavItem icon={<Highlighter size={14} />} label="All Highlights"
                active={dashboardMode === 'highlights'}
                onClick={() => { ensureDashboardVisible(); setDashboardMode(dashboardMode === 'highlights' ? 'folders' : 'highlights'); }} />
              {highlightColorOrder.map((cid) => {
                const c = highlightColors[cid];
                const count = highlights.filter((h) => h.color === cid).length;
                if (!count || !c) return null;
                return (
                  <div key={cid} className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs"
                    style={{ color: 'var(--text-muted,#64748b)' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                    <span className="flex-1 truncate">{c.label}</span>
                    <span className="font-mono text-[10px]">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FIX #4: New Article — below highlights, full width gradient button */}
        <div className="pt-4 px-0">
          <button onClick={() => openArticleModal()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--accent,#5b8dee), var(--accent2,#9b6dff))',
              boxShadow: '0 4px 14px rgba(91,141,238,0.25)',
            }}>
            <Plus size={16} /> New Article
          </button>
        </div>

      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t space-y-0.5"
        style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
        <NavItem icon={<Download size={14} />} label="Export All" onClick={exportAllArticles} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: 'var(--text-muted,#64748b)', border: '1px solid transparent' }}>
          <Upload size={14} /> Import .md
        </button>
        <input ref={fileRef} type="file" accept=".md" multiple className="hidden" onChange={handleImport} />
        <NavItem icon={<Settings size={14} />} label="Settings" onClick={() => setShowSettings(true)} />
      </div>
    </aside>
  );
}

// ── Recursive folder tree ──────────────────────────────────────
function FolderTree({ folder, depth, currentFolderId, expandedFolders, getChildFolders,
  getArticleCount, getArticleCountDeep, onBrowse, onOpenArticles, onToggle, onDelete, onRename, onAddChild }) {
  const children = getChildFolders(folder.id);
  const isActive = currentFolderId === folder.id;
  const isExpanded = !!expandedFolders[folder.id];
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(folder.name);
  const count = getArticleCountDeep(folder.id);

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = async (e) => {
    e.preventDefault();
    const articleId = e.dataTransfer.getData('articleId');
    if (articleId) await useStore.getState().moveArticleToFolder(Number(articleId), folder.id);
  };

  return (
    <div style={{ paddingLeft: depth * 10 }}>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-sm transition-all cursor-pointer group"
        style={isActive ? {
          background: 'linear-gradient(135deg, rgba(91,141,238,0.15), rgba(155,109,255,0.15))',
          border: '1px solid rgba(91,141,238,0.2)',
          color: 'var(--text-primary,#e8eaf6)',
        } : { border: '1px solid transparent', color: 'var(--text-muted,#9da4d4)' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => { onToggle(folder.id); onBrowse(folder.id); }}
      >
        <button onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0"
          style={{ color: 'var(--text-muted,#64748b)' }}>
          <ChevronRight size={13} className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
        </button>

        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          {isActive
            ? <FolderOpen size={14} style={{ color: 'var(--accent,#5b8dee)', flexShrink: 0 }} />
            : <Folder size={14} style={{ flexShrink: 0, color: 'var(--text-muted,#64748b)' }} />}
          {renaming ? (
            <input autoFocus value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { onRename(folder.id, renameVal.trim()); setRenaming(false); } if (e.key === 'Escape') setRenaming(false); }}
              onBlur={() => { onRename(folder.id, renameVal.trim()); setRenaming(false); }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-b text-xs outline-none"
              style={{ borderColor: 'var(--accent,#5b8dee)', color: 'var(--text-primary,#e8eaf6)' }} />
          ) : (
            <span className="truncate text-sm" title="Double-click to rename" onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true); }}>{folder.name}</span>
          )}
        </span>

        <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={(e) => { e.stopPropagation(); onAddChild(folder.id); }}
            className="w-5 h-5 flex items-center justify-center rounded-md hover:text-blue-400 transition-colors"
            style={{ color: 'var(--text-muted,#64748b)' }} title="Add subfolder"><Plus size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
            className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-muted,#64748b)' }} title="Rename folder"
            onMouseEnter={(e) => e.currentTarget.style.color='var(--accent,#5b8dee)'}
            onMouseLeave={(e) => e.currentTarget.style.color='var(--text-muted,#64748b)'}><PenLine size={11} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
            className="w-5 h-5 flex items-center justify-center rounded-md hover:text-red-400 transition-colors"
            style={{ color: 'var(--text-muted,#64748b)' }}><Trash2 size={12} /></button>
        </div>
        <span className="text-xs font-mono flex-shrink-0 px-1.5 py-0.5 rounded-md"
          style={{ color: 'var(--text-muted,#94a3b8)', background: 'rgba(255,255,255,0.07)', minWidth: '20px', textAlign: 'center' }}>
          {count}
        </span>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="mt-0.5">
          {children.map((child) => (
            <FolderTree key={child.id} folder={child} depth={depth + 1}
              currentFolderId={currentFolderId} expandedFolders={expandedFolders}
              getChildFolders={getChildFolders} getArticleCount={getArticleCount}
              onBrowse={onBrowse} onOpenArticles={onOpenArticles}
              getArticleCountDeep={getArticleCountDeep}
              onToggle={onToggle} onDelete={onDelete} onRename={onRename} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
}

function SecHeader({ label, collapsed, onToggle, onAdd }) {
  return (
    <div className="flex items-center justify-between px-2 mb-0.5">
      <button onClick={onToggle} className="flex items-center gap-1.5 transition-colors"
        style={{ color: 'var(--text-muted,#64748b)' }}>
        <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
        <ChevronDown size={10} className="transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }} />
      </button>
      {onAdd && (
        <button onClick={onAdd} className="w-5 h-5 flex items-center justify-center rounded hover:text-blue-400 transition-colors"
          style={{ color: 'var(--text-muted,#64748b)' }}><Plus size={11} /></button>
      )}
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group"
      style={active ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.15), rgba(155,109,255,0.15))',
        border: '1px solid rgba(91,141,238,0.2)',
        color: 'var(--text-primary,#e8eaf6)', fontWeight: 500,
      } : { border: '1px solid transparent', color: 'var(--text-muted,#9da4d4)' }}>
      <span className="flex items-center gap-2.5">
        <span style={{ color: active ? 'var(--accent,#5b8dee)' : 'var(--text-muted,#64748b)' }}>{icon}</span>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted,#9da4d4)' }}>{count}</span>
      )}
    </button>
  );
}

function CIBtn({ icon, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-all"
      style={active ? {
        background: 'linear-gradient(135deg, rgba(91,141,238,0.25), rgba(155,109,255,0.25))',
        border: '1px solid rgba(91,141,238,0.4)',
        color: 'var(--accent,#5b8dee)',
        boxShadow: '0 0 12px rgba(91,141,238,0.15)',
      } : {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-muted,#64748b)',
      }}>
      {icon}
    </button>
  );
}
