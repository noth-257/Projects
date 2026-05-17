import { useState } from 'react';
import { Search, FileText, Folder, ChevronRight, X, SlidersHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ArticleCard from './ArticleCard';
import { ArticleCardSkeleton } from '../ui/Skeleton';
import Button from '../ui/Button';

export default function ArticleList() {
  const {
    selectedFolderId, getFolderById, getFolderPath, loading,
    searchQuery, setSearchQuery, getFilteredArticles,
    openArticleModal, sidebarCollapsed, dashboardVisible,
    folders, setSelectedFolder, dashboardView, setDashboardView,
    articles, filterTag, setFilterTag, filterDateRange, setFilterDateRange,
    getAllTags, searchScope, setSearchScope,
    highlights, deleteHighlight, updateHighlightColor,
    highlightColors, highlightColorOrder,
    renameHighlightColor, addHighlightColor, removeHighlightColor,
    getRootFolders, getChildFolders, getArticleCount,
    folderDashboardId, setFolderDashboardId,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!dashboardVisible) return null;

  // ── HIGHLIGHTS VIEW ────────────────────────────────────────
  if (dashboardView === 'highlights') {
    return (
      <HighlightsPanel
        highlights={highlights}
        highlightColors={highlightColors}
        highlightColorOrder={highlightColorOrder}
        deleteHighlight={deleteHighlight}
        updateHighlightColor={updateHighlightColor}
        renameHighlightColor={renameHighlightColor}
        addHighlightColor={addHighlightColor}
        removeHighlightColor={removeHighlightColor}
        onBack={() => setDashboardView('articles')}
      />
    );
  }

  // ── FOLDERS VIEW — FIX #3: only show current level ─────────
  if (dashboardView === 'folders') {
    const parentId = folderDashboardId ?? null;
    const visibleFolders = parentId === null ? getRootFolders() : getChildFolders(parentId);
    const parentFolder = parentId ? getFolderById(parentId) : null;

    return (
      <div className="flex flex-col h-full border-r" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
        <PanelHeader title={parentFolder ? parentFolder.name : 'Folders'} count={visibleFolders.length}
          onBack={parentId ? () => {
            const parent = getFolderById(parentId);
            setFolderDashboardId(parent?.parentId ?? null);
          } : () => setDashboardView('articles')} />

        {/* Breadcrumb */}
        {parentId && (
          <div className="px-4 pb-2 flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-muted,#64748b)' }}>
            <button onClick={() => setFolderDashboardId(null)} className="hover:underline">Folders</button>
            <ChevronRight size={9} />
            <span style={{ color: 'var(--accent,#5b8dee)' }}>{parentFolder?.name}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
          {visibleFolders.length === 0
            ? <EmptyState icon="📁" message="No folders here" hint="Create one from the sidebar" />
            : visibleFolders.map((f) => {
              const children = getChildFolders(f.id);
              return (
                <FolderCard key={f.id} folder={f}
                  articleCount={getArticleCount(f.id)}
                  childCount={children.length}
                  path={`Folders / ${f.name}`}
                  onClick={() => {
                    if (children.length > 0) {
                      setFolderDashboardId(f.id); // drill in
                    } else {
                      setSelectedFolder(f.id);
                      setDashboardView('articles');
                    }
                  }} />
              );
            })
          }
        </div>
      </div>
    );
  }

  // ── TAGS VIEW ──────────────────────────────────────────────
  if (dashboardView === 'tags') {
    const tags = getAllTags();
    return (
      <div className="flex flex-col h-full border-r" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
        <PanelHeader title="Tags" count={tags.length} onBack={() => setDashboardView('articles')} />
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
          {tags.length === 0
            ? <EmptyState icon="🏷️" message="No tags yet" hint="Add tags when creating articles" />
            : <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag}
                  onClick={() => { setFilterTag(filterTag === tag ? null : tag); setDashboardView('articles'); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                  style={{
                    background: filterTag === tag ? 'rgba(91,141,238,0.2)' : 'rgba(255,255,255,0.06)',
                    borderColor: filterTag === tag ? 'rgba(91,141,238,0.4)' : 'var(--sidebar-border,rgba(255,255,255,0.1))',
                    color: filterTag === tag ? 'var(--accent,#5b8dee)' : 'var(--text-muted,#9da4d4)',
                  }}>
                  #{tag} <span className="ml-1 opacity-50">{articles.filter((a) => a.tags?.includes(tag)).length}</span>
                </button>
              ))}
            </div>
          }
        </div>
      </div>
    );
  }

  // ── ARTICLES VIEW ──────────────────────────────────────────
  const filtered = getFilteredArticles();
  const folder = selectedFolderId ? getFolderById(selectedFolderId) : null;
  const folderPath = selectedFolderId ? getFolderPath(selectedFolderId) : null;
  const title = folder ? folder.name : 'All Articles';
  const activeFilters = !!(filterTag || filterDateRange?.from || filterDateRange?.to || searchScope !== 'all');

  const applyDateFilter = () => setFilterDateRange({
    from: dateFrom ? new Date(dateFrom) : null,
    to: dateTo ? new Date(dateTo + 'T23:59:59') : null,
  });
  const clearFilters = () => { setFilterTag(null); setFilterDateRange(null); setDateFrom(''); setDateTo(''); setSearchScope('all'); setSearchQuery(''); };

  return (
    <div className="flex flex-col h-full border-r" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>

        {/* Clickable breadcrumb */}
        {folderPath && (
          <div className="flex items-center gap-1 text-[10px] font-mono mb-2 flex-wrap" style={{ color: 'var(--text-muted,#64748b)' }}>
            {folderPath.split(' / ').map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={9} />}
                <button
                  className="transition-colors hover:underline"
                  style={{ color: i === arr.length - 1 ? 'var(--accent,#5b8dee)' : 'var(--text-muted,#64748b)' }}
                  onClick={() => {
                    if (i === 0) { setSelectedFolder(null); setDashboardView('articles'); }
                  }}>{part}</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>{title}</h2>
          <div className="flex items-center gap-1.5">
            {filterTag && (
              <button onClick={() => setFilterTag(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]"
                style={{ background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.3)', color: 'var(--accent,#5b8dee)' }}>
                #{filterTag} <X size={9} />
              </button>
            )}
            <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted,#9da4d4)' }}>
              {filtered.length}
            </span>
          </div>
        </div>

        {/* New Article */}
        {!sidebarCollapsed && (
          <Button variant="primary" size="sm" className="w-full mb-3 justify-center"
            icon={<FileText size={13} />} onClick={() => openArticleModal()}>
            New Article
          </Button>
        )}

        {/* FIX #5: search filter icon INSIDE the search bar */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted,#64748b)' }} />
          <input type="text"
            placeholder={`Search ${searchScope === 'all' ? 'everything' : searchScope}...`}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--input-bg,rgba(255,255,255,0.05))',
              border: `1px solid var(--input-border,rgba(255,255,255,0.08))`,
              color: 'var(--text-primary,#e8eaf6)',
            }} />
          {/* Filter icon inside search bar on the right */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: activeFilters || showFilters ? 'var(--accent,#5b8dee)' : 'var(--text-muted,#64748b)' }}
            title="Filters">
            <SlidersHorizontal size={13} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="space-y-2.5 pt-3 mt-2 border-t" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.07))' }}>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted,#64748b)' }}>
                Search in
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {['all', 'title', 'content', 'tags'].map((s) => (
                  <button key={s} onClick={() => setSearchScope(s)}
                    className="px-2.5 py-1 rounded-lg text-xs transition-all capitalize"
                    style={searchScope === s ? {
                      background: 'rgba(91,141,238,0.2)', border: '1px solid rgba(91,141,238,0.4)', color: 'var(--accent,#5b8dee)',
                    } : { background: 'rgba(255,255,255,0.06)', border: '1px solid var(--sidebar-border,rgba(255,255,255,0.1))', color: 'var(--text-muted,#9da4d4)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted,#64748b)' }}>
                Date range
              </p>
              <div className="flex gap-2 items-center">
                {['', ''].map((_, i) => (
                  <input key={i} type="date"
                    value={i === 0 ? dateFrom : dateTo}
                    onChange={(e) => i === 0 ? setDateFrom(e.target.value) : setDateTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--input-bg,rgba(255,255,255,0.07))', border: '1px solid var(--input-border,rgba(255,255,255,0.1))', color: 'var(--text-primary,#e8eaf6)' }} />
                ))}
              </div>
              <div className="flex gap-2 mt-1.5">
                <button onClick={applyDateFilter}
                  className="flex-1 py-1 rounded-lg text-xs transition-all"
                  style={{ background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.3)', color: 'var(--accent,#5b8dee)' }}>
                  Apply
                </button>
                <button onClick={clearFilters}
                  className="flex-1 py-1 rounded-lg text-xs transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--sidebar-border,rgba(255,255,255,0.1))', color: 'var(--text-muted,#9da4d4)' }}>
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <ArticleCardSkeleton key={i} />)
          : filtered.length === 0
            ? <EmptyState icon="🔍" message={searchQuery ? 'No results' : 'No articles yet'}
                hint={searchQuery ? 'Try different filters' : 'Click "New Article" to start'} />
            : filtered.map((a) => <ArticleCard key={a.id} article={a} />)
        }
      </div>
    </div>
  );
}

// ── Highlights panel with add/rename/delete color ──────────────
function HighlightsPanel({ highlights, highlightColors, highlightColorOrder,
  deleteHighlight, updateHighlightColor, renameHighlightColor,
  addHighlightColor, removeHighlightColor, onBack }) {
  const [editingLabel, setEditingLabel] = useState(null); // colorId being renamed
  const [labelVal, setLabelVal] = useState('');
  const [showAddColor, setShowAddColor] = useState(false);
  const [newColorLabel, setNewColorLabel] = useState('');
  const [newColorDot, setNewColorDot] = useState('#a78bfa');

  return (
    <div className="flex flex-col h-full border-r" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
      <PanelHeader title="Highlights" count={highlights.length} onBack={onBack} />

      {/* Add new color */}
      <div className="px-4 pb-3 border-b" style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
        {showAddColor ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input type="color" value={newColorDot} onChange={(e) => setNewColorDot(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background: 'rgba(255,255,255,0.07)' }} />
              <input type="text" value={newColorLabel} onChange={(e) => setNewColorLabel(e.target.value)}
                placeholder="Label e.g. Summary"
                className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: 'var(--input-bg,rgba(255,255,255,0.07))', border: '1px solid var(--input-border,rgba(255,255,255,0.1))', color: 'var(--text-primary,#e8eaf6)' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                if (!newColorLabel.trim()) return;
                const id = 'custom_' + Date.now();
                addHighlightColor(id, newColorLabel.trim(), newColorDot);
                setShowAddColor(false); setNewColorLabel(''); setNewColorDot('#a78bfa');
              }}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'linear-gradient(135deg, var(--accent,#5b8dee), var(--accent2,#9b6dff))', color: '#fff' }}>
                Add Color
              </button>
              <button onClick={() => setShowAddColor(false)}
                className="flex-1 py-1.5 rounded-lg text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted,#9da4d4)', border: '1px solid var(--sidebar-border,rgba(255,255,255,0.1))' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddColor(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--sidebar-border,rgba(255,255,255,0.12))', color: 'var(--text-muted,#9da4d4)' }}>
            <Plus size={12} /> Add highlight color
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-5">
        {highlights.length === 0
          ? <EmptyState icon="✨" message="No highlights yet" hint="Select text in the reader to highlight" />
          : highlightColorOrder.map((cid) => {
            const group = highlights.filter((h) => h.color === cid);
            if (!group.length && !highlightColors[cid]) return null;
            const c = highlightColors[cid];
            if (!c) return null;
            return (
              <div key={cid}>
                {/* Color group header */}
                <div className="flex items-center gap-2 mb-2 px-1 group">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                  {editingLabel === cid ? (
                    <input autoFocus value={labelVal}
                      onChange={(e) => setLabelVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { renameHighlightColor(cid, labelVal.trim()); setEditingLabel(null); }
                        if (e.key === 'Escape') setEditingLabel(null);
                      }}
                      onBlur={() => { renameHighlightColor(cid, labelVal.trim()); setEditingLabel(null); }}
                      className="flex-1 bg-transparent border-b text-xs outline-none"
                      style={{ borderColor: c.dot, color: 'var(--text-primary,#e8eaf6)' }} />
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider flex-1"
                      style={{ color: 'var(--text-muted,#9da4d4)' }}>{c.label}</span>
                  )}
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted,#94a3b8)' }}>{group.length}</span>
                  {/* Edit label */}
                  <button onClick={() => { setEditingLabel(cid); setLabelVal(c.label); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted,#64748b)' }}>
                    <Pencil size={10} />
                  </button>
                  {/* Remove color */}
                  <button onClick={() => removeHighlightColor(cid)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                    style={{ color: 'var(--text-muted,#64748b)' }}>
                    <Trash2 size={10} />
                  </button>
                </div>

                {/* Highlight items */}
                {group.map((h) => (
                  <div key={h.id} className="mb-1.5 p-3 rounded-xl text-xs group/item"
                    style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                    <p className="leading-relaxed mb-2 line-clamp-3" style={{ color: 'var(--text-primary,#e8eaf6)' }}>
                      "{h.selectedText}"
                    </p>
                    <div className="flex items-center gap-1 flex-wrap opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {highlightColorOrder.map((nc) => highlightColors[nc] ? (
                        <button key={nc} onClick={() => updateHighlightColor(h.id, nc)}
                          className="w-3 h-3 rounded-full transition-transform hover:scale-125"
                          style={{ background: highlightColors[nc].dot }} title={highlightColors[nc].label} />
                      ) : null)}
                      <button onClick={() => deleteHighlight(h.id)}
                        className="ml-auto text-[10px] text-red-400 hover:text-red-300 transition-colors">
                        ✕ remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function PanelHeader({ title, count, onBack }) {
  return (
    <div className="px-5 pt-5 pb-4 border-b flex items-center justify-between"
      style={{ borderColor: 'var(--sidebar-border,rgba(255,255,255,0.06))' }}>
      <h2 className="font-bold text-base font-display" style={{ color: 'var(--text-primary,#e8eaf6)' }}>{title}</h2>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted,#9da4d4)' }}>{count}</span>
        {onBack && (
          <button onClick={onBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-black/10"
            style={{ color: 'var(--text-muted,#64748b)' }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// FIX #6: FolderCard — clean layout, no overflow issues
function FolderCard({ folder, articleCount, childCount, path, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-4 rounded-2xl transition-all group"
      style={{ background: 'var(--card-bg,rgba(255,255,255,0.04))', border: '1px solid var(--card-border,rgba(255,255,255,0.07))' }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(91,141,238,0.12)', border: '1px solid rgba(91,141,238,0.2)' }}>
          <Folder size={16} style={{ color: 'var(--accent,#5b8dee)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary,#e8eaf6)' }}>{folder.name}</p>
          <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: 'var(--text-muted,#64748b)' }}>{path}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted,#9da4d4)' }}>
            {articleCount}
          </span>
          {childCount > 0 && <ChevronRight size={13} style={{ color: 'var(--text-muted,#64748b)' }} />}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ icon, message, hint }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-6 animate-fade-in">
      <span className="text-3xl mb-3">{icon}</span>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary,#c5c9e8)' }}>{message}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted,#64748b)' }}>{hint}</p>
    </div>
  );
}
