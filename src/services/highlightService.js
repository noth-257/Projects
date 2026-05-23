/**
 * highlightService.js — all DB ops for highlights isolated here.
 * Components never touch db.highlights directly.
 */
import db from '../db';

export const highlightService = {
  async getByArticle(articleId) {
    return db.highlights.where('articleId').equals(articleId).sortBy('startOffset');
  },
  async create({ articleId, selectedText, color, startOffset, endOffset }) {
    const id = await db.highlights.add({
      articleId, selectedText, color, startOffset, endOffset,
      createdAt: new Date(),
    });
    return db.highlights.get(id);
  },
  async updateColor(id, color) {
    await db.highlights.update(id, { color });
    return db.highlights.get(id);
  },
  // Find all highlights that overlap [startOffset, endOffset) for an article
  async getOverlapping(articleId, startOffset, endOffset) {
    const all = await db.highlights.where('articleId').equals(articleId).toArray();
    return all.filter(h => h.endOffset > startOffset && h.startOffset < endOffset);
  },
  // Find highlights with same selectedText (dedup)
  async getByText(articleId, selectedText) {
    const all = await db.highlights.where('articleId').equals(articleId).toArray();
    return all.filter(h => h.selectedText === selectedText);
  },

  async delete(id) {
    return db.highlights.delete(id);
  },
  async deleteByArticle(articleId) {
    return db.highlights.where('articleId').equals(articleId).delete();
  },
  async getAll() {
    return db.highlights.orderBy('createdAt').reverse().toArray();
  },
};

export default highlightService;
