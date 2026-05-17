import Dexie from 'dexie';

export const db = new Dexie('ArticleVaultDB');

db.version(1).stores({
  folders:  '++id, name, createdAt, updatedAt',
  articles: '++id, title, folderId, createdAt, updatedAt, *tags',
  tags:     '++id, name, color',
});

db.version(2).stores({
  folders:    '++id, name, createdAt, updatedAt',
  articles:   '++id, title, folderId, createdAt, updatedAt, *tags',
  tags:       '++id, name, color',
  highlights: '++id, articleId, color, createdAt',
});

// v3 — subfolders: folders get parentId field
db.version(3).stores({
  folders:    '++id, name, parentId, createdAt, updatedAt',
  articles:   '++id, title, folderId, createdAt, updatedAt, *tags',
  tags:       '++id, name, color',
  highlights: '++id, articleId, color, createdAt',
});

db.on('populate', async () => {
  const folderId = await db.folders.add({
    name: 'Getting Started', parentId: null, createdAt: new Date(), updatedAt: new Date(),
  });
  await db.articles.add({
    title: 'Welcome to ArticleVault',
    content: `# Welcome to ArticleVault 🗄️\n\nArticleVault is your **offline-first** article management system.\n\n## Features\n\n- **Offline First** — All data lives in IndexedDB\n- **Markdown Support** — Full markdown rendering\n- **Subfolders** — Nested folder organization\n- **Highlighting** — Select text, pick a color\n- **Drag & Drop** — Move articles between folders\n- **Import/Export** — .md file support\n\n## Highlighting\n\nSelect any text in this view to see the highlighting toolbar. Choose **Bold**, *Italic*, or pick a highlight color.\n\n> Try selecting this blockquote to highlight it!\n\n\`\`\`js\nconst vault = new ArticleVault();\nvault.save({ title: "My Article" });\n\`\`\`\n\nEnjoy building your knowledge base!`,
    folderId, tags: ['welcome', 'guide'], pinned: false,
    createdAt: new Date(), updatedAt: new Date(),
  });
});

export default db;
