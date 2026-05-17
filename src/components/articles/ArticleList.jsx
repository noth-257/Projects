import { useState } from 'react';
import { Search, FileText, Folder, ChevronRight, X, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ArticleCard from './ArticleCard';
import { ArticleCardSkeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import { HIGHLIGHT_COLORS, COLOR_ORDER } from '../../utils/highlightUtils';

export default function ArticleList() {
  const {
    selectedFolderId, getFolderById, getFolderPath, loading,
    searchQuery, setSearchQuery, getFilteredArticles,
    openArticleModal, sidebarCollapsed, dashboardVisible,
    folders, setSelectedFolder, dashboardView, setDashboardView,
    articles, filterTag, setFilterTag, filterDateRange, setFilterDateRange,
    getAllTags, searchScope, setSearchScope,
    highlights, deleteHighlight, updateHighlightColor,
    selectedArticle,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!dashboardVisible) return null;

  const filtered = getFilteredArticles();
  const folder = selectedFolderId ? getFolderById(selectedFolderId) : null;
  const folderPath = selectedFolderId ? getFolderPath(selectedFolderId) : null;

  const applyDateFilter = () => {
    setFilterDateRange({
      from: dateFrom ? new Date(dateFrom) : null,
      to: dateTo ? new Date(dateTo + 'T23:59:59') : null,
    });
  };
  const clearFilters = () => {
    setFilterTag(null); setFilterDateRange(null); setDateFrom(''); setDateTo('');
    setSearchScope('all'); setSearchQuery('');
  };

  // ── Highlights view ────────────────────────────────────────
  if (dashboardView === 'highlights') {
    return (
      <div className="flex flex-col h-full border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <PanelHeader title="All Highlights" count={highlights.length} onBack={() => setDashboardView('articles')} />
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
          {highlights.length === 0
            ? <EmptyState icon="✨" message="No highlights yet" hint="Select text in the reader to highlight" />
            : COLOR_ORDER.map((cid) => {
              const group = highlights.filter((h) => h.color === cid);
              if (!group.length) return null;
              const c = HIGHLIGHT_COLORS[cid];
              return (
                <div key={cid}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{c.label}</span>
                    <span className="text-[10px] text-ink-600 font-mono ml-auto">{group.length}</span>
                  </div>
                  {group.map((h) => (
                    <div key={h.id} className="mb-1.5 p-3 rounded-xl text-xs"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <p className="text-ink-100 leading-relaxed mb-2 line-clamp-3">"{h.selectedText}"</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {COLOR_ORDER.map((nc) => (
                          <button key={nc} onClick={() => updateHighlightColor(h.id, nc)}
                            className="w-3 h-3 rounded-full transition-transform hover:scale-125"
                            style={{ background: HIGHLIGHT_COLORS[nc].dot }} title={HIGHLIGHT_COLORS[nc].label} />
                        ))}
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

  // ── Folders view ───────────────────────────────────────────
  if (dashboardView === 'folders') {
    return (
      <div className="flex flex-col h-full border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <PanelHeader title="Folders" count={folders.length} onBack={() => setDashboardView('articles')} />
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-2">
          {folders.length === 0
            ? <EmptyState icon="📁" message="No folders yet" hint="Create one from the sidebar" />
            : folders.map((f) => (
              <FolderCard key={f.id} folder={f}
                articleCount={articles.filter((a) => a.folderId === f.id).length}
                path={`Folders / ${f.name}`}
                onClick={() => { setSelectedFolder(f.id); setDashboardView('articles'); }} />
            ))
          }
        </div>
      </div>
    );
  }

  // ── Tags view ──────────────────────────────────────────────
  if (dashboardView === 'tags') {
    const tags = getAllTags();
    return (
      <div className="flex flex-col h-full border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
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
                    borderColor: filterTag === tag ? 'rgba(91,141,238,0.4)' : 'rgba(255,255,255,0.1)',
                    color: filterTag === tag ? '#5b8dee' : '#9da4d4',
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

  // ── Articles view ──────────────────────────────────────────
  const title = folder ? folder.name : 'All Articles';
  const activeFilters = !!(filterTag || filterDateRange?.from || filterDateRange?.to || searchScope !== 'all');

  return (
    <div className="flex flex-col h-full border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

        {/* Clickable breadcrumb */}
        {folderPath && (
          <div className="flex items-center gap-1 text-[10px] text-ink-500 mb-2 font-mono flex-wrap">
            {folderPath.split(' / ').map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={9} />}
                <button
                  className={`hover:text-aurora-blue transition-colors ${i === arr.length - 1 ? 'text-aurora-blue' : 'hover:underline'}`}
                  onClick={() => {
                    if (i === 0) { setSelectedFolder(null); setDashboardView('articles'); }
                    else if (i === arr.length - 1) { /* already here */ }
                    else {
                      const f = useStore.getState().folders.find((x) => x.name === part);
                      if (f) { setSelectedFolder(f.id); setDashboardView('articles'); }
                    }
                  }}
                >{part}</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-ink-100 text-base font-display">{title}</h2>
          <div className="flex items-center gap-1.5">
            {filterTag && (
              <button onClick={() => setFilterTag(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-aurora-blue"
                style={{ background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.3)' }}>
                #{filterTag} <X size={9} />
              </button>
            )}
            <button onClick={() => setShowFilters((v) => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${activeFilters || showFilters ? 'text-aurora-blue' : 'text-ink-500 hover:text-ink-200'}`}
              style={activeFilters ? { background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.3)' } : {}}>
              <SlidersHorizontal size={13} />
            </button>
            <span className="text-xs font-mono text-ink-500 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)' }}>{filtered.length}</span>
          </div>
        </div>

        {/* New Article */}
        {!sidebarCollapsed && (
          <Button variant="primary" size="sm" className="w-full mb-3 justify-center"
            icon={<FileText size={13} />} onClick={() => openArticleModal()}>
            New Article
          </Button>
        )}

        {/* Search with scope */}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input type="text" placeholder={`Search ${searchScope === 'all' ? 'everything' : searchScope}...`}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-ink-100 placeholder-ink-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {/* Search scope */}
            <div>
              <p className="text-[10px] text-ink-500 mb-1.5 font-medium uppercase tracking-wider">Search in</p>
              <div className="flex gap-1.5 flex-wrap">
                {['all', 'title', 'content', 'tags'].map((s) => (
                  <button key={s} onClick={() => setSearchScope(s)}
                    className="px-2.5 py-1 rounded-lg text-xs transition-all capitalize"
                    style={searchScope === s ? {
                      background: 'rgba(91,141,238,0.2)', border: '1px solid rgba(91,141,238,0.4)', color: '#5b8dee',
                    } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9da4d4' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Date range */}
            <div>
              <p className="text-[10px] text-ink-500 mb-1.5 font-medium uppercase tracking-wider">Date range</p>
              <div className="flex gap-2 items-center">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs text-ink-200 outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <span className="text-ink-600 text-xs">→</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs text-ink-200 outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex gap-2 mt-1.5">
                <button onClick={applyDateFilter}
                  className="flex-1 py-1 rounded-lg text-xs text-aurora-blue transition-all"
                  style={{ background: 'rgba(91,141,238,0.15)', border: '1px solid rgba(91,141,238,0.3)' }}>
                  Apply
                </button>
                <button onClick={clearFilters}
                  className="flex-1 py-1 rounded-lg text-xs text-ink-400 hover:text-ink-200 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
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

function PanelHeader({ title, count, onBack }) {
  return (
    <div className="px-5 pt-5 pb-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <h2 className="font-bold text-ink-100 text-base font-display">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-ink-500 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)' }}>{count}</span>
        {onBack && <button onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-500 hover:text-ink-100 hover:bg-white/8 transition-all">
          <X size={14} />
        </button>}
      </div>
    </div>
  );
}

function FolderCard({ folder, articleCount, path, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left p-4 rounded-2xl transition-all group"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(91,141,238,0.12)', border: '1px solid rgba(91,141,238,0.2)' }}>
            <Folder size={16} className="text-aurora-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-100">{folder.name}</p>
            <p className="text-[10px] text-ink-500 font-mono mt-0.5">{path}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ink-500 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)' }}>{articleCount}</span>
          <ChevronRight size={13} className="text-ink-600 group-hover:text-ink-300 transition-colors" />
        </div>
      </div>
    </button>
  );
}

function EmptyState({ icon, message, hint }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-6 animate-fade-in">
      <span className="text-3xl mb-3">{icon}</span>
      <p className="text-ink-300 text-sm font-medium mb-1">{message}</p>
      <p className="text-ink-500 text-xs">{hint}</p>
    </div>
  );
}
