import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CopyPlus, Edit3, ImageUp, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../app/AppContext';
import type { DraftForm, DraftPost } from '../app/types';
import { Alert, ConfirmDialog, EmptyState, FormField, Modal } from '../components/common';
import { formatDateTime } from '../utils/date';

const blank: DraftForm = {
  title: '',
  objective: 'promotion',
  platform: 'instagram',
  contentMode: 'caption',
  caption: '',
  productId: '',
  hashtags: '',
  mediaIds: [],
};

export function DraftsPage() {
  const {
    drafts,
    products,
    media,
    createDraft,
    updateDraft,
    deleteDraft,
    duplicateDraft,
    draftSaving,
    draftEditor,
    openDraftEditor,
    updateDraftEditor,
    resetDraftEditor,
  } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);

  const visible = useMemo(() => [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [drafts]);

  useEffect(() => {
    if (!autosaveEnabled || !draftEditor.draftId) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      updateDraft(draftEditor.draftId as string, draftEditor.form).catch(() => undefined);
    }, 10_000);

    return () => window.clearInterval(timer);
  }, [autosaveEnabled, draftEditor, updateDraft]);

  const openNew = () => {
    openDraftEditor(null);
    setModalOpen(true);
  };

  const openEdit = (draft: DraftPost) => {
    openDraftEditor(draft);
    setModalOpen(true);
    setAutosaveEnabled(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!draftEditor.form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (draftEditor.form.contentMode !== 'image' && !draftEditor.form.caption.trim()) {
      setError('Caption is required for caption or combined posts.');
      return;
    }

    if (draftEditor.draftId) {
      await updateDraft(draftEditor.draftId, draftEditor.form);
    } else {
      await createDraft(draftEditor.form);
    }

    setModalOpen(false);
    setAutosaveEnabled(false);
    resetDraftEditor();
  };

  const toggleMedia = (mediaId: string) => {
    const next = draftEditor.form.mediaIds.includes(mediaId)
      ? draftEditor.form.mediaIds.filter((entry) => entry !== mediaId)
      : [...draftEditor.form.mediaIds, mediaId];
    updateDraftEditor({ mediaIds: next });
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Drafts</h2>
            <p>Create, duplicate, and schedule publish-ready content with attached media.</p>
          </div>
          <button className="btn" onClick={openNew}>
            <Edit3 size={16} />
            New draft
          </button>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No drafts yet"
            description="Create a draft to unlock scheduling, media attachments, and AI workflows."
            action={
              <button className="btn" onClick={openNew}>
                <Sparkles size={16} />
                Create draft
              </button>
            }
          />
        ) : (
          <div className="drafts-grid">
            {visible.map((draft) => (
              <article className="panel reveal draft-card" key={draft.id}>
                <div className="toolbar" style={{ marginBottom: '0.9rem' }}>
                  <div>
                    <strong>{draft.title}</strong>
                    <div className="subtitle-row" style={{ marginTop: '0.4rem' }}>
                      <span className="pill">{draft.platform}</span>
                      <span className="pill">{draft.objective}</span>
                      <span className={`pill ${draft.status === 'scheduled' ? 'success' : 'warning'}`}>{draft.status}</span>
                    </div>
                  </div>
                  <div className="muted-text">Updated {formatDateTime(draft.updatedAt)}</div>
                </div>

                {(() => {
                  const assets = draft.mediaIds
                    .map((mediaId) => media.find((entry) => entry.id === mediaId))
                    .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
                  const cover = assets[0];

                  return (
                    <div className="draft-media-preview" aria-label="Draft media preview">
                      {cover ? (
                        <>
                          <img className="draft-media-image" src={cover.url} alt={cover.name} />
                          {assets.length > 1 ? <span className="pill">+{assets.length - 1} more</span> : null}
                        </>
                      ) : (
                        <div className="draft-media-empty">
                          <ImageUp size={16} />
                          <span>No media attached</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <p>{draft.caption || 'No caption added yet.'}</p>
                {draft.mediaIds.length > 0 ? (
                  <div className="chip-row" style={{ margin: '0.75rem 0 1rem' }}>
                    {draft.mediaIds.map((mediaId) => {
                      const asset = media.find((entry) => entry.id === mediaId);
                      if (!asset) {
                        return null;
                      }

                      return (
                        <span key={asset.id} className="chip">
                          <ImageUp size={14} />
                          {asset.name}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
                <div className="draft-card-actions">
                  <button className="btn btn-secondary" onClick={() => openEdit(draft)}>
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button className="btn btn-secondary" onClick={() => duplicateDraft(draft.id)}>
                    <CopyPlus size={16} />
                    Duplicate
                  </button>
                  <button className="btn btn-danger" onClick={() => setDeleteId(draft.id)}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen ? (
        <Modal
          title={draftEditor.draftId ? 'Edit draft' : 'Create draft'}
          onClose={() => {
            setModalOpen(false);
            setAutosaveEnabled(false);
            resetDraftEditor();
          }}
        >
          <form className="grid two" onSubmit={submit}>
            {error ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <Alert kind="error" title="Draft validation" description={error} />
              </div>
            ) : null}
            <FormField label="Title">
              <input value={draftEditor.form.title} onChange={(event) => updateDraftEditor({ title: event.target.value })} />
            </FormField>
            <FormField label="Objective">
              <select value={draftEditor.form.objective} onChange={(event) => updateDraftEditor({ objective: event.target.value as DraftForm['objective'] })}>
                {['promotion', 'education', 'engagement'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Platform">
              <select value={draftEditor.form.platform} onChange={(event) => updateDraftEditor({ platform: event.target.value as DraftForm['platform'] })}>
                {['instagram', 'facebook', 'linkedin'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Content mode">
              <select value={draftEditor.form.contentMode} onChange={(event) => updateDraftEditor({ contentMode: event.target.value as DraftForm['contentMode'] })}>
                {['caption', 'image', 'both'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Product link optional">
              <select value={draftEditor.form.productId} onChange={(event) => updateDraftEditor({ productId: event.target.value })}>
                <option value="">None</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Caption">
              <textarea value={draftEditor.form.caption} onChange={(event) => updateDraftEditor({ caption: event.target.value })} />
            </FormField>
            <FormField label="Hashtags" help="Comma-separated hashtags">
              <input value={draftEditor.form.hashtags} onChange={(event) => updateDraftEditor({ hashtags: event.target.value })} />
            </FormField>
            <div className="panel" style={{ gridColumn: '1 / -1' }}>
              <div className="panel-header">
                <div>
                  <h3>Attach media</h3>
                  <p>Select saved media from your library for this draft.</p>
                </div>
              </div>
              {media.length === 0 ? (
                <EmptyState title="No media available" description="Upload images in the media library first." />
              ) : (
                <div className="media-grid">
                  {media.map((asset) => {
                    const active = draftEditor.form.mediaIds.includes(asset.id);

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className="media-card"
                        onClick={() => toggleMedia(asset.id)}
                        style={{ borderColor: active ? 'rgba(56,189,248,0.6)' : undefined }}
                      >
                        <img className="media-thumb" src={asset.url} alt={asset.name} />
                        <div className="panel-header" style={{ marginTop: '0.75rem' }}>
                          <div>
                            <strong>{asset.name}</strong>
                            <p>{active ? 'Attached' : 'Tap to attach'}</p>
                          </div>
                          {active ? <span className="pill success">Selected</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setModalOpen(false);
                  setAutosaveEnabled(false);
                  resetDraftEditor();
                }}
              >
                Cancel
              </button>
              <button className="btn" disabled={draftSaving}>
                {draftSaving ? 'Saving...' : 'Save draft'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteId ? (
        <ConfirmDialog
          title="Delete draft"
          description="This removes the draft from the workspace."
          confirmLabel="Delete"
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            await deleteDraft(deleteId);
            setDeleteId(null);
          }}
        />
      ) : null}
    </div>
  );
}