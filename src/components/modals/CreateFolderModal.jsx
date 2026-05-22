import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useStore } from '../../store/useStore';

export default function CreateFolderModal() {
  const { showFolderModal, closeFolderModal, createFolder, folders, parentFolderForNew } = useStore();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a folder name'); return; }
    setLoading(true);
    const pid = parentId !== '' ? Number(parentId) : (parentFolderForNew ?? null);
    await createFolder(name.trim(), pid);
    setLoading(false);
    setName(''); setParentId(''); setError('');
    closeFolderModal();
  };

  const handleClose = () => { setName(''); setParentId(''); setError(''); closeFolderModal(); };

  return (
    <Modal isOpen={showFolderModal} onClose={handleClose} title="New Folder" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-300 mb-2">Folder Name</label>
          <input
            autoFocus type="text" value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Research, Bookmarks..."
            className="w-full px-4 py-2.5 rounded-xl text-sm text-ink-100 placeholder-ink-400 outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: error ? '1px solid rgba(244,114,182,0.5)' : '1px solid rgba(255,255,255,0.1)' }}
          />
          {error && <p className="text-aurora-rose text-xs mt-1.5">{error}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-300 mb-2">Parent Folder (optional)</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-ink-100 outline-none appearance-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="" style={{ background: '#12152a' }}>— Root (no parent) —</option>
            {folders.map((f) => (
              <option key={f.id} value={String(f.id)} style={{ background: '#12152a' }}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" size="md" className="flex-1" icon={<FolderPlus size={15} />} loading={loading} onClick={handleSave}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}
