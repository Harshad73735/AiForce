import { useMemo, useState, type FormEvent } from 'react';
import { CalendarClock, Camera, ThumbsUp, Briefcase, ImagePlus, Sparkles, Save } from 'lucide-react';
import { useApp } from '../app/AppContext';
import type { AiForm } from '../app/types';
import { Alert, EmptyState, FormField } from '../components/common';
import { formatDateTime } from '../utils/date';
import { fromDateInputValue, isFutureDate } from '../utils/date';

const blank: AiForm = {
  objective: 'promotion',
  platform: 'instagram',
  outputMode: 'both',
  productId: '',
  customInstruction: '',
  selectedMediaId: '',
};

export function AiStudioPage() {
  const { products, media, drafts, generateContent, aiGenerating, aiLogs, applyCaptionToDraft, createDraft, scheduleDraft, saveGeneratedMedia } = useApp();
  const [form, setForm] = useState(blank);
  const [result, setResult] = useState<{
    mainCaption: string;
    alternatives: string[];
    hashtags: string[];
    imagePrompt: string;
    imagePreviewUrl: string;
    palette: string[];
  } | null>(null);
  const [draftTarget, setDraftTarget] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [error, setError] = useState('');
  const [savingMedia, setSavingMedia] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [lastCreatedDraftId, setLastCreatedDraftId] = useState<string | null>(null);

  const draftTargets = useMemo(() => drafts.filter((draft) => draft.status === 'draft'), [drafts]);
  const recentDrafts = useMemo(() => [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [drafts]);
  const recentScheduled = useMemo(() => drafts.filter((draft) => draft.status === 'scheduled').sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? '')).slice(0, 5), [drafts]);
  const selectedMedia = media.find((asset) => asset.id === form.selectedMediaId) ?? null;

  const platformOptions = [
    { value: 'instagram', label: 'Instagram', icon: Camera },
    { value: 'facebook', label: 'Facebook', icon: ThumbsUp },
    { value: 'linkedin', label: 'LinkedIn', icon: Briefcase },
  ] as const;

  const modeOptions = [
    { value: 'caption', label: 'Caption' },
    { value: 'image', label: 'Image' },
    { value: 'both', label: 'Both' },
  ] as const;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const output = await generateContent(form);
      setResult(output);
      if (!draftTitle.trim()) {
        setDraftTitle(`${form.platform} ${form.objective} concept`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    }
  };

  const createDraftFromResult = async (shouldSchedule: boolean) => {
    if (!result) {
      return;
    }

    if (shouldSchedule && (!scheduleDate || !isFutureDate(fromDateInputValue(scheduleDate)))) {
      setError('Choose a future schedule date before creating and scheduling.');
      return;
    }

    setSavingWorkflow(true);
    try {
      const mediaIds = selectedMedia ? [selectedMedia.id] : [];
      if (result.imagePreviewUrl && form.outputMode !== 'caption') {
        const generatedMedia = await saveGeneratedMedia(`${form.platform} ${form.objective} visual`, result.imagePreviewUrl);
        mediaIds.unshift(generatedMedia.id);
      }

      const draft = await createDraft({
        title: draftTitle.trim() || `${form.platform} ${form.objective} concept`,
        objective: form.objective,
        platform: form.platform,
        contentMode: form.outputMode,
        caption: result.mainCaption,
        productId: form.productId,
        hashtags: result.hashtags.join(', '),
        mediaIds,
      });
      setLastCreatedDraftId(draft.id);

      if (shouldSchedule) {
        await scheduleDraft(draft.id, { scheduledAt: fromDateInputValue(scheduleDate) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create draft from result.');
    } finally {
      setSavingWorkflow(false);
    }
  };

  const saveGeneratedPreview = async () => {
    if (!result?.imagePreviewUrl) {
      return;
    }

    setSavingMedia(true);
    try {
      await saveGeneratedMedia(`${form.platform} ${form.objective} concept`, result.imagePreviewUrl);
    } finally {
      setSavingMedia(false);
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>AI Studio</h2>
            <p>Generate captions, image concepts, or both, then push them straight into drafts or scheduling.</p>
          </div>
        </div>
        <form className="grid two" onSubmit={submit}>
          {error ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <Alert kind="error" title="AI Studio" description={error} />
            </div>
          ) : null}
          <FormField label="Objective">
            <select value={form.objective} onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value as AiForm['objective'] }))}>
              {['promotion', 'education', 'engagement'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Platform">
            <div className="segmented-control">
              {platformOptions.map((option) => {
                const Icon = option.icon;
                const active = form.platform === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`segment ${active ? 'active' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, platform: option.value }))}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FormField>
          <FormField label="Output mode">
            <div className="segmented-control">
              {modeOptions.map((option) => {
                const active = form.outputMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`segment ${active ? 'active' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, outputMode: option.value }))}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </FormField>
          <FormField label="Optional product context">
            <select value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}>
              <option value="">None</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Select media from library" help="Choose a stored asset to inform the generated result.">
            <select value={form.selectedMediaId} onChange={(event) => setForm((current) => ({ ...current, selectedMediaId: event.target.value }))}>
              <option value="">None</option>
              {media.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </FormField>
          {selectedMedia ? (
            <div className="panel" style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.75rem' }}>
              <div className="subtitle-row">
                <ImagePlus size={18} />
                <strong>Selected media preview</strong>
              </div>
              <img className="generated-image" src={selectedMedia.url} alt={selectedMedia.name} />
            </div>
          ) : null}
          <FormField label="Custom instruction">
            <textarea value={form.customInstruction} onChange={(event) => setForm((current) => ({ ...current, customInstruction: event.target.value }))} />
          </FormField>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="muted-text">AI logs are saved to localStorage as demo history.</div>
            <button className="btn" disabled={aiGenerating}>
              <Sparkles size={16} />
              {aiGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Generated output</h2>
              <p>Choose a caption, save the image, or create a draft directly from this result.</p>
            </div>
          </div>
          {result ? (
            <div className="stack">
              {form.outputMode !== 'image' ? (
                <div className="preview-card">
                  <strong>Main caption</strong>
                  <p>{result.mainCaption}</p>
                </div>
              ) : null}
              {result.alternatives.map((caption, index) => (
                <div className="preview-card" key={caption}>
                  <strong>Alternative {index + 1}</strong>
                  <p>{caption}</p>
                </div>
              ))}
              {form.outputMode !== 'caption' ? (
                <div className="preview-card">
                  <strong>Image concept</strong>
                  <p>{result.imagePrompt}</p>
                  <img className="generated-image" src={result.imagePreviewUrl} alt="Generated preview" />
                  <div className="chip-row" style={{ marginTop: '0.75rem' }}>
                    {result.palette.map((color) => (
                      <span key={color} className="chip">
                        <span className="color-swatch" style={{ background: color }} />
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="preview-card">
                <strong>Hashtags</strong>
                <p>{result.hashtags.join(' ')}</p>
              </div>
              <FormField label="Apply to draft">
                <select value={draftTarget} onChange={(event) => setDraftTarget(event.target.value)}>
                  <option value="">Choose draft</option>
                  {draftTargets.map((draft) => (
                    <option key={draft.id} value={draft.id}>
                      {draft.title}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="toolbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      setError('');
                      await applyCaptionToDraft(draftTarget, result.mainCaption, result.hashtags);
                    } catch (applyError) {
                      setError(applyError instanceof Error ? applyError.message : 'Unable to apply caption to draft.');
                    }
                  }}
                  disabled={!draftTarget || form.outputMode === 'image' || savingWorkflow}
                >
                  Apply main caption
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void saveGeneratedPreview()} disabled={savingMedia || form.outputMode === 'caption' || savingWorkflow}>
                  <Save size={16} />
                  Save image
                </button>
              </div>
              <div className="panel" style={{ display: 'grid', gap: '0.75rem' }}>
                <div className="subtitle-row">
                  <CalendarClock size={18} />
                  <strong>Create or schedule from this result</strong>
                </div>
                <FormField label="Draft title">
                  <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="instagram promotion concept" />
                </FormField>
                <FormField label="Schedule time">
                  <input type="datetime-local" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
                </FormField>
                <div className="toolbar-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => void createDraftFromResult(false)} disabled={savingMedia || savingWorkflow}>
                    Create draft
                  </button>
                  <button type="button" className="btn" onClick={() => void createDraftFromResult(true)} disabled={savingMedia || savingWorkflow}>
                    <CalendarClock size={16} />
                    Create & schedule
                  </button>
                </div>
                {lastCreatedDraftId ? (
                  <div className="pill success">Last created draft id: {lastCreatedDraftId}</div>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState title="No generation yet" description="Run the form to create a caption or image concept set." />
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>AI generation log</h2>
              <p>Recent output previews saved for demo continuity.</p>
            </div>
          </div>
          <div className="stack">
            {aiLogs.slice(0, 5).map((log) => (
              <div className="preview-card" key={log.id}>
                <strong>{log.promptSummary}</strong>
                <p className="muted-text">{log.outputPreview}</p>
              </div>
            ))}
            <div className="preview-card">
              <strong>Recent drafts data sync</strong>
              <div className="stack" style={{ gap: '0.6rem', marginTop: '0.75rem' }}>
                {recentDrafts.length === 0 ? <p className="muted-text">No drafts available yet.</p> : recentDrafts.map((draft) => (
                  <div key={draft.id} className="ai-sync-row">
                    <span>{draft.title}</span>
                    <span className={`pill ${draft.status === 'scheduled' ? 'success' : 'warning'}`}>{draft.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="preview-card">
              <strong>Upcoming scheduled from data</strong>
              <div className="stack" style={{ gap: '0.6rem', marginTop: '0.75rem' }}>
                {recentScheduled.length === 0 ? <p className="muted-text">No scheduled posts yet.</p> : recentScheduled.map((draft) => (
                  <div key={draft.id} className="ai-sync-row">
                    <span>{draft.title}</span>
                    <small className="muted-text">{formatDateTime(draft.scheduledAt)}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}