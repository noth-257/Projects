import { create } from 'zustand';
import db from '../db';
import highlightService from '../services/highlightService';

export const THEMES = {
  dark:   { label: 'Dark',   bg: '#07080d', sidebar: 'rgba(13,15,26,0.97)', accent: '#5b8dee', accent2: '#9b6dff', isLight: false },
  darker: { label: 'Abyss',  bg: '#020204', sidebar: 'rgba(5,5,10,0.99)',   accent: '#4a7fd4', accent2: '#7b5ce0', isLight: false },
  light:  { label: 'Light',  bg: '#f5f6fa', sidebar: 'rgba(248,249,252,0.99)', accent: '#3b6fd4', accent2: '#7c3aed', isLight: true },
  ocean:  { label: 'Ocean',  bg: '#040d1a', sidebar: 'rgba(4,13,26,0.98)',  accent: '#0ea5e9', accent2: '#06b6d4', isLight: false },
  forest: { label: 'Forest', bg: '#040d08', sidebar: 'rgba(4,13,8,0.98)',   accent: '#22c55e', accent2: '#16a34a', isLight: false },
};

export const DEFAULT_HIGHLIGHT_COLORS = {
  yellow: { id: 'yellow', label: 'Important',   dot: '#fde047', bg: 'rgba(253,224,71,0.35)',  border: 'rgba(253,224,71,0.6)'  },
  red:    { id: 'red',    label: 'Problems',     dot: '#f87171', bg: 'rgba(248,113,113,0.3)',  border: 'rgba(248,113,113,0.6)' },
  green:  { id: 'green',  label: 'Definitions',  dot: '#4ade80', bg: 'rgba(74,222,128,0.25)', border: 'rgba(74,222,128,0.5)'  },
  blue:   { id: 'blue',   label: 'Quotes',       dot: '#60a5fa', bg: 'rgba(96,165,250,0.28)', border: 'rgba(96,165,250,0.55)' },
  purple: { id: 'purple', label: 'Ideas',        dot: '#a78bfa', bg: 'rgba(167,139,250,0.28)',border: 'rgba(167,139,250,0.55)'},
  orange: { id: 'orange', label: 'Action items', dot: '#fb923c', bg: 'rgba(251,146,60,0.25)', border: 'rgba(251,146,60,0.5)'  },
  pink:   { id: 'pink',   label: 'Key terms',    dot: '#f472b6', bg: 'rgba(244,114,182,0.25)',border: 'rgba(244,114,182,0.5)' },
};
export const DEFAULT_COLOR_ORDER = ['yellow', 'red', 'green', 'blue', 'purple', 'orange', 'pink'];

const useDataStore = create((set, get) => ({
  folders: [], articles: [], loading: true,
  selectedFolderId: null, selectedArticle: null,
  highlights: [], highlightsLoading: false,
  searchQuery: '', filterTag: null, filterDateRange: null, searchScope: 'all',
  showFolderModal: false, showArticleModal: false,
  editingArticle: null, parentFolderForNew: null,
  sidebarCollapsed: false,
  dashboardVisible: true,
  foldersCollapsed: false, tagsCollapsed: false, highlightsCollapsed: false,
  expandedFolders: {},
  dashboardView: 'articles',
  // folderDashboardId: null = root, number = drilled into that folder
  folderDashboardId: null,
  showSettings: false,
  theme: 'dark',
  highlightColors: { ...DEFAULT_HIGHLIGHT_COLORS },
  highlightColorOrder: [...DEFAULT_COLOR_ORDER],

  // ── Loaders ───────────────────────────────────────────────
  loadFolders: async () => { set({ folders: await db.folders.orderBy('createdAt').toArray() }); },
  loadArticles: async () => {
    set({ loading: true });
    set({ articles: await db.articles.orderBy('updatedAt').reverse().toArray(), loading: false });
  },
  loadHighlights: async (articleId) => {
    set({ highlightsLoading: true });
    set({ highlights: await highlightService.getByArticle(articleId), highlightsLoading: false });
  },
  init: async () => {
    const savedTheme = localStorage.getItem('av-theme') || 'dark';
    const savedColors = (() => { try { return JSON.parse(localStorage.getItem('av-hlcolors') || 'null'); } catch { return null; } })();
    set({ theme: savedTheme, highlightColors: savedColors || { ...DEFAULT_HIGHLIGHT_COLORS } });
    await get().loadFolders();
    await get().loadArticles();
  },

  // ── Folders ───────────────────────────────────────────────
  createFolder: async (name, parentId = null) => {
    await db.folders.add({ name, parentId, createdAt: new Date(), updatedAt: new Date() });
    await get().loadFolders();
  },
  deleteFolder: async (id) => {
    const children = get().folders.filter((f) => f.parentId === id);
    for (const c of children) await get().deleteFolder(c.id);
    await db.folders.delete(id);
    await db.articles.where('folderId').equals(id).modify({ folderId: null });
    if (get().selectedFolderId === id) set({ selectedFolderId: null });
    if (get().folderDashboardId === id) set({ folderDashboardId: null });
    await get().loadFolders(); await get().loadArticles();
  },
  renameFolder: async (id, name) => {
    await db.folders.update(id, { name, updatedAt: new Date() });
    await get().loadFolders();
  },

  // ── Articles ──────────────────────────────────────────────
  createArticle: async (data) => {
    const folderId = data.folderId ? Number(data.folderId) : null;
    await db.articles.add({ ...data, folderId, tags: data.tags || [], pinned: false, createdAt: new Date(), updatedAt: new Date() });
    await get().loadArticles();
  },
  updateArticle: async (id, data) => {
    const folderId = data.folderId ? Number(data.folderId) : null;
    await db.articles.update(id, { ...data, folderId, updatedAt: new Date() });
    await get().loadArticles();
    if (get().selectedArticle?.id === id) set({ selectedArticle: await db.articles.get(id) });
  },
  deleteArticle: async (id) => {
    await db.articles.delete(id);
    await highlightService.deleteByArticle(id);
    if (get().selectedArticle?.id === id) set({ selectedArticle: null, highlights: [] });
    await get().loadArticles();
  },
  pinArticle: async (id) => {
    const a = await db.articles.get(id);
    await db.articles.update(id, { pinned: !a.pinned, updatedAt: new Date() });
    await get().loadArticles();
    if (get().selectedArticle?.id === id) set({ selectedArticle: await db.articles.get(id) });
  },
  renameArticle: async (id, title) => {
    await db.articles.update(id, { title, updatedAt: new Date() });
    await get().loadArticles();
    if (get().selectedArticle?.id === id) set({ selectedArticle: await db.articles.get(id) });
  },
  // FIX #5: moveArticleToFolder — accepts both number and null correctly
  moveArticleToFolder: async (articleId, folderId) => {
    const fid = (folderId !== null && folderId !== undefined && folderId !== '')
      ? Number(folderId) : null;
    await db.articles.update(Number(articleId), { folderId: fid, updatedAt: new Date() });
    await get().loadArticles();
  },

  // ── Highlights ────────────────────────────────────────────
  createHighlight: async (payload) => {
    const h = await highlightService.create(payload);
    set((s) => ({ highlights: [...s.highlights, h].sort((a, b) => a.startOffset - b.startOffset) }));
    return h;
  },
  updateHighlightColor: async (id, color) => {
    await highlightService.updateColor(id, color);
    set((s) => ({ highlights: s.highlights.map((h) => h.id === id ? { ...h, color } : h) }));
  },
  deleteHighlight: async (id) => {
    await highlightService.delete(id);
    set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) }));
  },
  renameHighlightColor: (colorId, newLabel) => {
    set((s) => {
      const updated = { ...s.highlightColors, [colorId]: { ...s.highlightColors[colorId], label: newLabel } };
      localStorage.setItem('av-hlcolors', JSON.stringify(updated));
      return { highlightColors: updated };
    });
  },
  addHighlightColor: (id, label, dot) => {
    const bg = dot + '40', border = dot + '99';
    set((s) => {
      const updated = { ...s.highlightColors, [id]: { id, label, dot, bg, border } };
      const order = [...s.highlightColorOrder, id];
      localStorage.setItem('av-hlcolors', JSON.stringify(updated));
      return { highlightColors: updated, highlightColorOrder: order };
    });
  },
  removeHighlightColor: (colorId) => {
    set((s) => {
      const updated = { ...s.highlightColors };
      delete updated[colorId];
      const order = s.highlightColorOrder.filter((c) => c !== colorId);
      localStorage.setItem('av-hlcolors', JSON.stringify(updated));
      return { highlightColors: updated, highlightColorOrder: order };
    });
  },

  // ── Import / Export ───────────────────────────────────────
  exportArticle: (article) => {
    const folder = get().folders.find((f) => f.id === article.folderId);
    const meta = `---\ntitle: ${article.title}\nfolder: ${folder?.name || ''}\ntags: [${(article.tags||[]).join(', ')}]\ncreated: ${new Date(article.createdAt).toISOString()}\n---\n\n`;
    const blob = new Blob([meta + article.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${article.title.replace(/[^a-z0-9]/gi,'_')}.md`; a.click();
    URL.revokeObjectURL(url);
  },
  exportAllArticles: async () => {
    const articles = await db.articles.toArray();
    const folders = get().folders;
    const blob = new Blob([articles.map((a) => { const f = folders.find((x) => x.id === a.folderId); return `# ${a.title}\n_${f?.name || 'None'}_\n\n${a.content}\n\n---\n`; }).join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ArticleVault_export.md'; a.click();
    URL.revokeObjectURL(url);
  },
  importMarkdownFile: async (file, folderId = null) => {
    const text = await file.text();
    let title = file.name.replace(/\.md$/i, ''), content = text, tags = [];
    const fm = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fm) {
      const meta = fm[1]; content = fm[2].trim();
      const t = meta.match(/^title:\s*(.+)$/m); const tg = meta.match(/^tags:\s*\[([^\]]*)\]/m);
      if (t) title = t[1].trim(); if (tg) tags = tg[1].split(',').map((s) => s.trim()).filter(Boolean);
    }
    await get().createArticle({ title, content, folderId, tags });
  },

  // ── UI ────────────────────────────────────────────────────
  setSelectedFolder: (id) => set({ selectedFolderId: id, selectedArticle: null, highlights: [] }),
  setSelectedArticle: async (article) => {
    set({ selectedArticle: article, highlights: [] });
    if (article) await get().loadHighlights(article.id);
  },
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  setFilterDateRange: (r) => set({ filterDateRange: r }),
  setSearchScope: (s) => set({ searchScope: s }),
  toggleFolderExpand: (id) => set((s) => ({ expandedFolders: { ...s.expandedFolders, [id]: !s.expandedFolders[id] } })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDashboard: () => set((s) => ({ dashboardVisible: !s.dashboardVisible })),

  // FIX #1: any nav action that needs dashboard auto-expands it
  ensureDashboardVisible: () => { if (!get().dashboardVisible) set({ dashboardVisible: true }); },

  toggleFoldersSection: () => set((s) => {
    const nowCollapsed = !s.foldersCollapsed;
    return {
      foldersCollapsed: nowCollapsed,
      dashboardView: nowCollapsed ? 'articles' : 'folders',
      folderDashboardId: nowCollapsed ? null : s.folderDashboardId,
    };
  }),
  toggleTagsSection: () => set((s) => ({
    tagsCollapsed: !s.tagsCollapsed,
    dashboardView: s.tagsCollapsed ? 'tags' : 'articles',
  })),
  toggleHighlightsSection: () => set((s) => ({
    highlightsCollapsed: !s.highlightsCollapsed,
    dashboardView: s.highlightsCollapsed ? 'highlights' : 'articles',
  })),
  setDashboardView: (view) => set({ dashboardView: view }),
  setFolderDashboardId: (id) => set({ folderDashboardId: id, dashboardView: 'folders' }),

  setTheme: (t) => { localStorage.setItem('av-theme', t); set({ theme: t }); },
  setShowSettings: (v) => set({ showSettings: v }),
  openFolderModal: (parentId = null) => set({ showFolderModal: true, parentFolderForNew: parentId }),
  closeFolderModal: () => set({ showFolderModal: false, parentFolderForNew: null }),
  openArticleModal: (article = null) => set({ showArticleModal: true, editingArticle: article }),
  closeArticleModal: () => set({ showArticleModal: false, editingArticle: null }),

  // ── Computed ──────────────────────────────────────────────
  getFilteredArticles: () => {
    const { articles, selectedFolderId, searchQuery, filterTag, filterDateRange, searchScope } = get();
    let f = articles;
    if (selectedFolderId !== null) f = f.filter((a) => a.folderId === selectedFolderId);
    if (filterTag) f = f.filter((a) => a.tags?.includes(filterTag));
    if (filterDateRange?.from) f = f.filter((a) => new Date(a.createdAt) >= filterDateRange.from);
    if (filterDateRange?.to) f = f.filter((a) => new Date(a.createdAt) <= filterDateRange.to);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter((a) => {
        if (searchScope === 'title') return a.title.toLowerCase().includes(q);
        if (searchScope === 'tags') return a.tags?.some((t) => t.toLowerCase().includes(q));
        if (searchScope === 'content') return a.content?.toLowerCase().includes(q);
        return a.title.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q) || a.tags?.some((t) => t.toLowerCase().includes(q));
      });
    }
    return [...f].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  },
  getRecentArticles: (limit = 5) => {
    return [...get().articles]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);
  },
  getFolderById: (id) => get().folders.find((f) => f.id === id),
  getArticleCount: (folderId) => get().articles.filter((a) => a.folderId === folderId).length,
  getRootFolders: () => get().folders.filter((f) => !f.parentId),
  getChildFolders: (parentId) => get().folders.filter((f) => f.parentId === parentId),
  // FIX #4: returns array of {id, name} from root down to folderId
  getFolderAncestors: (folderId) => {
    if (!folderId) return [];
    const folders = get().folders;
    const chain = [];
    let cur = folders.find((f) => f.id === folderId);
    while (cur) {
      chain.unshift({ id: cur.id, name: cur.name });
      cur = cur.parentId ? folders.find((f) => f.id === cur.parentId) : null;
    }
    return chain; // [{id, name}, ...] from root → current
  },
  getFolderPath: (folderId) => {
    if (!folderId) return null;
    const ancestors = get().getFolderAncestors(folderId);
    if (!ancestors.length) return null;
    return ['Folders', ...ancestors.map((a) => a.name)].join(' / ');
  },
  getAllTags: () => [...new Set(get().articles.flatMap((a) => a.tags || []))].sort(),
}));

export const useStore = useDataStore;
export default useDataStore;
