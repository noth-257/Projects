import { useState, useEffect } from 'react';
import { Save, Hash } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import { useStore } from '../../store/useStore';

export default function CreateArticleModal() {
  const { showArticleModal, closeArticleModal, createArticle, updateArticle, editingArticle, folders } = useStore();

  const [form, setForm] = useState({ title: '', content: '', folderId: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditing = !!editingArticle;

  useEffect(() => {
    if (editingArticle) {
      setForm({
        title: editingArticle.title || '',
        content: editingArticle.content || '',
        // Store as string for select value, convert on save
        folderId: editingArticle.folderId != null ? String(editingArticle.folderId) : '',
        tags: editingArticle.tags || [],
      });
    } else {
      setForm({ title: '', content: '', folderId: '', tags: [] });
    }
    setTagInput('');
    setErrors({});
  }, [editingArticle, showArticleModal]);

  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !form.tags.includes(tag)) setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  };

  const removeTag = (t) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const handleSave = async () => {
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    setLoading(true);
    // Convert folderId: '' → null, '5' → 5 (number for Dexie index)
    const folderId = form.folderId !== '' ? Number(form.folderId) : null;
    const data = { ...form, folderId };
    if (isEditing) await updateArticle(editingArticle.id, data);
    else await createArticle(data);
    setLoading(false);
    closeArticleModal();
  };

  return (
    <Modal
      isOpen={showArticleModal}
      onClose={closeArticleModal}
      title={isEditing ? 'Edit Article' : 'New Article'}
      size="xl"
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-2">Title *</label>
          <input
            autoFocus
            type="text"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Article title..."
            className="w-full px-4 py-2.5 rounded-xl text-sm text-ink-100 placeholder-ink-400 outline-none font-display text-base"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: errors.title ? '1px solid rgba(244,114,182,0.5)' : '1px solid rgba(255,255,255,0.1)',
            }}
          />
          {errors.title && <p className="text-aurora-rose text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Folder + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-300 mb-2">Folder</label>
            <select
              value={form.folderId}
              onChange={(e) => setField('folderId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-ink-100 outline-none appearance-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="" style={{ background: '#12152a' }}>— No folder —</option>
              {folders.map((f) => (
                <option key={f.id} value={String(f.id)} style={{ background: '#12152a' }}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-300 mb-2">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag + Enter"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm text-ink-100 placeholder-ink-400 outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={addTag}
                className="px-3 py-2.5 rounded-xl text-ink-300 hover:text-aurora-blue transition-colors"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Hash size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Tags display */}
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((t) => <Tag key={t} label={t} onRemove={() => removeTag(t)} />)}
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-2">Content (Markdown)</label>
          <textarea
            value={form.content}
            onChange={(e) => setField('content', e.target.value)}
            placeholder={`# My Article\n\nStart writing in **Markdown**...`}
            rows={16}
            className="w-full px-4 py-3 rounded-xl text-sm text-ink-200 placeholder-ink-400 outline-none resize-none font-mono leading-relaxed scrollbar-thin"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={closeArticleModal}>Cancel</Button>
          <Button
            variant="primary" size="md" className="flex-1"
            icon={<Save size={15} />} loading={loading} onClick={handleSave}
          >
            {isEditing ? 'Save Changes' : 'Create Article'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
