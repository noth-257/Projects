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
