import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import db from '../db';
import highlightService from '../services/highlightService';

// Theme presets
export const THEMES = {
  dark:   { label: 'Dark',   bg: '#07080d', sidebar: 'rgba(13,15,26,0.97)', accent: '#5b8dee', accent2: '#9b6dff' },
  darker: { label: 'Abyss',  bg: '#020204', sidebar: 'rgba(5,5,10,0.99)',   accent: '#4a7fd4', accent2: '#7b5ce0' },
  light:  { label: 'Light',  bg: '#f0f2f8', sidebar: 'rgba(240,242,248,1)', accent: '#3b6fd4', accent2: '#7c3aed' },
  ocean:  { label: 'Ocean',  bg: '#040d1a', sidebar: 'rgba(4,13,26,0.98)',  accent: '#0ea5e9', accent2: '#06b6d4' },
  forest: { label: 'Forest', bg: '#040d08', sidebar: 'rgba(4,13,8,0.98)',   accent: '#22c55e', accent2: '#16a34a' },
};

const useDataStore = create((set, get) => ({
  // ── Data ───────────────────────────────────────────────────
  folders: [], articles: [], loading: true,
  selectedFolderId: null, selectedArticle: null,
  highlights: [], highlightsLoading: false,

  // ── Filters ────────────────────────────────────────────────
  searchQuery: '', filterTag: null, filterDateRange: null,
  searchScope: 'all', // 'all' | 'title' | 'content' | 'tags'

  // ── Modals ─────────────────────────────────────────────────
  showFolderModal: false, showArticleModal: false,
  editingArticle: null, parentFolderForNew: null,

  // ── UI ─────────────────────────────────────────────────────
  sidebarCollapsed: false, dashboardVisible: true,
  foldersCollapsed: false, tagsCollapsed: false, highlightsCollapsed: false,
  expandedFolders: {}, dashboardView: 'articles',
  showSettings: false,

  // ── Theme (persisted separately via localStorage) ──────────
  theme: 'dark',

  // ── Loaders ────────────────────────────────────────────────
  loadFolders: async () => {
    const folders = await db.folders.orderBy('createdAt').toArray();
    set({ folders });
  },
  loadArticles: async () => {
    set({ loading: true });
    const articles = await db.articles.orderBy('updatedAt').reverse().toArray();
    set({ articles, loading: false });
  },
  loadHighlights: async (articleId) => {
    set({ highlightsLoading: true });
    const highlights = await highlightService.getByArticle(articleId);
    set({ highlights, highlightsLoading: false });
  },
  init: async () => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('av-theme') || 'dark';
    set({ theme: savedTheme });
    await get().loadFolders();
    await get().loadArticles();
  },

  // ── Folder CRUD ────────────────────────────────────────────
  createFolder: async (name, parentId = null) => {
    const id = await db.folders.add({ name, parentId, createdAt: new Date(), updatedAt: new Date() });
    await get().loadFolders();
    return id;
  },
  deleteFolder: async (id) => {
    // Delete subfolders recursively
    const children = get().folders.filter((f) => f.parentId === id);
    for (const child of children) await get().deleteFolder(child.id);
    await db.folders.delete(id);
    await db.articles.where('folderId').equals(id).modify({ folderId: null });
    if (get().selectedFolderId === id) set({ selectedFolderId: null });
    await get().loadFolders();
    await get().loadArticles();
  },
  renameFolder: async (id, name) => {
    await db.folders.update(id, { name, updatedAt: new Date() });
    await get().loadFolders();
  },

  // ── Article CRUD ───────────────────────────────────────────
  createArticle: async (data) => {
    const folderId = data.folderId ? Number(data.folderId) : null;
    const id = await db.articles.add({
      ...data, folderId, tags: data.tags || [], pinned: false,
      createdAt: new Date(), updatedAt: new Date(),
    });
    await get().loadArticles();
    return id;
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
  moveArticleToFolder: async (id, folderId) => {
    const fid = folderId ? Number(folderId) : null;
    await db.articles.update(id, { folderId: fid, updatedAt: new Date() });
    await get().loadArticles();
  },

  // ── Highlight CRUD ─────────────────────────────────────────
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

  // ── Import / Export ────────────────────────────────────────
  exportArticle: (article) => {
    const folder = get().folders.find((f) => f.id === article.folderId);
    const meta = [
      '---',
      `title: ${article.title}`,
      `folder: ${folder?.name || ''}`,
      `tags: [${(article.tags || []).join(', ')}]`,
      `created: ${new Date(article.createdAt).toISOString()}`,
      `updated: ${new Date(article.updatedAt).toISOString()}`,
      '---',
      '',
    ].join('\n');
    const blob = new Blob([meta + article.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },
  exportAllArticles: async () => {
    const articles = await db.articles.toArray();
    const folders = get().folders;
    const lines = articles.map((a) => {
      const f = folders.find((x) => x.id === a.folderId);
      return `# ${a.title}\n_Folder: ${f?.name || 'None'} | Tags: ${(a.tags||[]).join(', ')}_\n\n${a.content}\n\n---\n`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ArticleVault_export.md'; a.click();
    URL.revokeObjectURL(url);
  },
  importMarkdownFile: async (file, folderId = null) => {
    const text = await file.text();
    // Parse optional frontmatter
    let title = file.name.replace(/\.md$/i, '');
    let content = text;
    let tags = [];
    const fm = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fm) {
      const meta = fm[1];
      content = fm[2].trim();
      const t = meta.match(/^title:\s*(.+)$/m);
      const tg = meta.match(/^tags:\s*\[([^\]]*)\]/m);
      if (t) title = t[1].trim();
      if (tg) tags = tg[1].split(',').map((s) => s.trim()).filter(Boolean);
    }
    await get().createArticle({ title, content, folderId, tags });
  },

  // ── UI actions ─────────────────────────────────────────────
  setSelectedFolder: (id) => set({ selectedFolderId: id, selectedArticle: null, highlights: [] }),
  setSelectedArticle: async (article) => {
    set({ selectedArticle: article, highlights: [] });
    if (article) await get().loadHighlights(article.id);
  },
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  setFilterDateRange: (range) => set({ filterDateRange: range }),
  setSearchScope: (scope) => set({ searchScope: scope }),
  toggleFolderExpand: (id) => set((s) => ({ expandedFolders: { ...s.expandedFolders, [id]: !s.expandedFolders[id] } })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDashboard: () => set((s) => ({ dashboardVisible: !s.dashboardVisible })),
  toggleFoldersSection: () => set((s) => ({ foldersCollapsed: !s.foldersCollapsed })),
  toggleTagsSection: () => set((s) => ({ tagsCollapsed: !s.tagsCollapsed })),
  toggleHighlightsSection: () => set((s) => ({ highlightsCollapsed: !s.highlightsCollapsed })),
  setDashboardView: (view) => set({ dashboardView: view }),
  setTheme: (theme) => { localStorage.setItem('av-theme', theme); set({ theme }); },
  setShowSettings: (v) => set({ showSettings: v }),

  openFolderModal: (parentId = null) => set({ showFolderModal: true, parentFolderForNew: parentId }),
  closeFolderModal: () => set({ showFolderModal: false, parentFolderForNew: null }),
  openArticleModal: (article = null) => set({ showArticleModal: true, editingArticle: article }),
  closeArticleModal: () => set({ showArticleModal: false, editingArticle: null }),

  // ── Computed ───────────────────────────────────────────────
  getFilteredArticles: () => {
    const { articles, selectedFolderId, searchQuery, filterTag, filterDateRange, searchScope } = get();
    let filtered = articles;
    if (selectedFolderId !== null) filtered = filtered.filter((a) => a.folderId === selectedFolderId);
    if (filterTag) filtered = filtered.filter((a) => a.tags?.includes(filterTag));
    if (filterDateRange?.from) filtered = filtered.filter((a) => new Date(a.createdAt) >= filterDateRange.from);
    if (filterDateRange?.to) filtered = filtered.filter((a) => new Date(a.createdAt) <= filterDateRange.to);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        if (searchScope === 'title') return a.title.toLowerCase().includes(q);
        if (searchScope === 'tags') return a.tags?.some((t) => t.toLowerCase().includes(q));
        if (searchScope === 'content') return a.content?.toLowerCase().includes(q);
        return a.title.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q) || a.tags?.some((t) => t.toLowerCase().includes(q));
      });
    }
    return [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  },
  getFolderById: (id) => get().folders.find((f) => f.id === id),
  getArticleCount: (folderId) => get().articles.filter((a) => a.folderId === folderId).length,
  getRootFolders: () => get().folders.filter((f) => !f.parentId),
  getChildFolders: (parentId) => get().folders.filter((f) => f.parentId === parentId),
  getFolderPath: (folderId) => {
    if (!folderId) return null;
    const folders = get().folders;
    const parts = [];
    let current = folders.find((f) => f.id === folderId);
    while (current) {
      parts.unshift(current.name);
      current = current.parentId ? folders.find((f) => f.id === current.parentId) : null;
    }
    return parts.length ? ['Folders', ...parts].join(' / ') : null;
  },
  getAllTags: () => {
    const tagSet = new Set(get().articles.flatMap((a) => a.tags || []));
    return [...tagSet].sort();
  },
}));

export const useStore = useDataStore;
export default useDataStore;
