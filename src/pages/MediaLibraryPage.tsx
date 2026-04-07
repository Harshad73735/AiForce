import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { useApp } from '../app/AppContext';
import { Alert, EmptyState } from '../components/common';
import { formatDateTime } from '../utils/date';

export function MediaLibraryPage() {
  const { media, uploadMedia, deleteMedia } = useApp();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const filtered = useMemo(
    () =>
      [...media]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((asset) => asset.name.toLowerCase().includes(query.toLowerCase())),
    [media, query],
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setError('');
    setUploading(true);
    try {
      await uploadMedia(files);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Media Library</h2>
          <p>Upload branded images, reuse them in drafts, and keep publish assets organized.</p>
        </div>
        <div className="toolbar-actions">
          <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={16} />
            {uploading ? 'Uploading...' : 'Upload media'}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                void handleUpload(event.target.files);
              }}
            />
          </label>
          <input placeholder="Search assets" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      {error ? <Alert kind="error" title="Upload error" description={error} /> : null}

      <div className="file-dropzone" style={{ marginBottom: '1rem' }}>
        <div className="subtitle-row">
          <Sparkles size={18} />
          <strong>Asset library</strong>
          <span className="muted-text">Images saved here can be attached to drafts and schedules.</span>
        </div>
        <div className="muted-text">Drop or upload product photos, story images, and generated visuals. Everything is stored locally in this demo.</div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No media yet"
          description="Upload your first image or save an AI-generated asset to start building the library."
        />
      ) : (
        <div className="media-grid">
          {filtered.map((asset) => (
            <article className="media-card reveal" key={asset.id}>
              <img className="media-thumb" src={asset.url} alt={asset.name} />
              <div className="panel-header" style={{ marginTop: '0.9rem' }}>
                <div>
                  <strong>{asset.name}</strong>
                  <p>
                    {asset.source === 'upload' ? 'Uploaded image' : 'Generated asset'} • {formatDateTime(asset.createdAt)}
                  </p>
                </div>
              </div>
              <div className="media-actions">
                <button className="btn btn-secondary" onClick={() => deleteMedia(asset.id)}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
