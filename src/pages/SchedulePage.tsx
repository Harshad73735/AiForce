import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, Clock3, ImageUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Alert, EmptyState, FormField, Modal } from '../components/common';
import { formatDate, formatDateTime, fromDateInputValue, isFutureDate, toDateInputValue } from '../utils/date';

export function SchedulePage() {
  const { drafts, scheduleDraft, unscheduleDraft, deleteDraft, draftSaving, media } = useApp();
  const navigate = useNavigate();
  const scheduled = drafts.filter((draft) => draft.status === 'scheduled').sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
  const draftPool = useMemo(() => drafts.filter((draft) => draft.status === 'draft'), [drafts]);
  const [selectedId, setSelectedId] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [error, setError] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonth = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    return base;
  }, [monthOffset]);

  const monthLabel = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const startDay = currentMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const days = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startDay + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    const key = date.toISOString().slice(0, 10);
    const items = scheduled.filter((draft) => draft.scheduledAt?.slice(0, 10) === key);
    return { dayNumber, date, key, items };
  });

  const activeDraft = drafts.find((draft) => draft.id === selectedId);
  const minScheduleDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const openScheduler = (draftId: string, scheduledAt?: string | null) => {
    setSelectedId(draftId);
    setDateValue(scheduledAt && isFutureDate(scheduledAt) ? toDateInputValue(scheduledAt) : '');
    setError('');
  };

  const closeModal = () => {
    setSelectedId('');
    setDateValue('');
    setError('');
  };

  const removeActiveDraft = async () => {
    if (!activeDraft) {
      return;
    }
    try {
      await deleteDraft(activeDraft.id);
      closeModal();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this post.');
    }
  };

  const openDrafts = () => {
    navigate('/drafts');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!selectedId || !dateValue || !isFutureDate(fromDateInputValue(dateValue))) {
      setError('Pick a future date and time.');
      return;
    }
    try {
      await scheduleDraft(selectedId, { scheduledAt: fromDateInputValue(dateValue) });
      closeModal();
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : 'Unable to save schedule changes.');
    }
  };

  const isReschedule = activeDraft?.status === 'scheduled';

  return (
    <section className="calendar-layout">
      <article className="panel">
        <div className="calendar-toolbar">
          <div>
            <div className="subtitle-row">
              <CalendarDays size={18} />
              <h2 style={{ margin: 0 }}>Schedule</h2>
            </div>
            <p className="calendar-subtitle">A month grid for scheduled posts, with reschedule actions and media-aware previews.</p>
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setMonthOffset((current) => current - 1)}>
              <ArrowLeft size={16} />
              Previous
            </button>
            <button className="btn btn-secondary" onClick={() => setMonthOffset(0)}>
              Today
            </button>
            <button className="btn btn-secondary" onClick={() => setMonthOffset((current) => current + 1)}>
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="calendar-toolbar" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>{monthLabel}</h3>
          <span className="pill">{scheduled.length} scheduled posts</span>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="calendar-head">
              {day}
            </div>
          ))}
          {days.map((entry, index) => {
            const todayKey = new Date().toISOString().slice(0, 10);
            if (!entry) {
              return <div key={`empty-${index}`} className="calendar-day is-empty" />;
            }

            return (
              <article key={entry.key} className={`calendar-day ${entry.key === todayKey ? 'is-today' : ''}`}>
                <div className="calendar-date">{entry.dayNumber}</div>
                <div className="calendar-events">
                  {entry.items.slice(0, 3).map((draft) => {
                    const assetCount = draft.mediaIds.length;
                    return (
                      <button key={draft.id} className="event-chip" onClick={() => openScheduler(draft.id, draft.scheduledAt)}>
                        <strong>{draft.title}</strong>
                        <small>
                          {formatDateTime(draft.scheduledAt)} • {assetCount} media
                        </small>
                      </button>
                    );
                  })}
                  {entry.items.length > 3 ? <span className="pill">+{entry.items.length - 3} more</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <section className="grid two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Scheduled posts</h3>
              <p>Grouped in a compact timeline for quick scanning.</p>
            </div>
          </div>
          {scheduled.length === 0 ? (
            <EmptyState title="No scheduled posts yet" description="Schedule a draft to populate this view." />
          ) : (
            <div className="stack">
              {scheduled.map((draft) => (
                <article className="panel" key={draft.id}>
                  <div className="toolbar" style={{ marginBottom: '0.5rem' }}>
                    <div>
                      <strong>{draft.title}</strong>
                      <div className="muted-text">{draft.platform} • {draft.objective}</div>
                    </div>
                    <span className="pill success">Scheduled</span>
                  </div>
                  <div className="subtitle-row" style={{ marginBottom: '0.6rem' }}>
                    <Clock3 size={15} />
                    <span>{formatDateTime(draft.scheduledAt)}</span>
                  </div>
                  {draft.mediaIds.length > 0 ? (
                    <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
                      {draft.mediaIds.map((mediaId) => {
                        const asset = media.find((entry) => entry.id === mediaId);
                        return asset ? (
                          <span key={asset.id} className="chip">
                            <ImageUp size={14} />
                            {asset.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : null}
                  <div className="toolbar-actions">
                    <button className="btn btn-secondary" onClick={() => openScheduler(draft.id, draft.scheduledAt)}>
                      Reschedule
                    </button>
                    <button className="btn btn-secondary" onClick={() => unscheduleDraft(draft.id)}>
                      Unschedule
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Drafts ready to schedule</h3>
              <p>Pick an unscheduled draft and assign a future time.</p>
            </div>
          </div>
          {draftPool.length === 0 ? (
            <EmptyState title="No draft pool" description="All drafts are already scheduled." />
          ) : (
            <div className="stack">
              {draftPool.map((draft) => (
                <div key={draft.id} className="panel">
                  <div className="subtitle-row" style={{ marginBottom: '0.5rem' }}>
                    <Sparkles size={15} />
                    <strong>{draft.title}</strong>
                  </div>
                  <div className="muted-text">{draft.platform} • {draft.objective} • {draft.contentMode}</div>
                  {draft.mediaIds.length > 0 ? (
                    <div className="chip-row" style={{ margin: '0.7rem 0' }}>
                      {draft.mediaIds.map((mediaId) => {
                        const asset = media.find((entry) => entry.id === mediaId);
                        return asset ? (
                          <span key={asset.id} className="chip">
                            <ImageUp size={14} />
                            {asset.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : null}
                  <button className="btn btn-secondary" onClick={() => openScheduler(draft.id)}>
                    <CalendarPlus size={16} />
                    Schedule
                  </button>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {scheduled.length === 0 ? <Alert kind="info" title="Calendar ready" description="As soon as you schedule a draft, it will appear in the month grid above." /> : null}

      {selectedId ? (
        <Modal title={`${isReschedule ? 'Reschedule' : 'Schedule'} ${activeDraft?.title ?? 'post'}`} onClose={() => setSelectedId('')}>
          <form className="stack" onSubmit={submit}>
            {error ? <Alert kind="error" title="Schedule validation" description={error} /> : null}
            {activeDraft ? (
              <div className="panel" style={{ display: 'grid', gap: '0.75rem' }}>
                <strong>{activeDraft.title}</strong>
                <p className="muted-text" style={{ margin: 0 }}>{activeDraft.platform} • {activeDraft.objective} • {activeDraft.contentMode}</p>
                <p style={{ margin: 0 }}>{activeDraft.caption || 'No caption added yet.'}</p>
                {activeDraft.hashtags.length > 0 ? (
                  <div className="chip-row">
                    {activeDraft.hashtags.map((tag) => (
                      <span key={tag} className="chip">{tag}</span>
                    ))}
                  </div>
                ) : null}
                {activeDraft.mediaIds.length > 0 ? (
                  <div className="chip-row">
                    {activeDraft.mediaIds.map((mediaId) => {
                      const asset = media.find((entry) => entry.id === mediaId);
                      return asset ? (
                        <img
                          key={asset.id}
                          src={asset.url}
                          alt={asset.name}
                          style={{ width: '68px', height: '68px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(51, 65, 85, 0.9)' }}
                        />
                      ) : null;
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
            <FormField label="Date and time"><input type="datetime-local" min={minScheduleDateTime} value={dateValue} onChange={(event) => setDateValue(event.target.value)} /></FormField>
            <div className="toolbar-actions" style={{ justifyContent: 'space-between' }}>
              <div className="toolbar-actions">
                <button type="button" className="btn btn-secondary" onClick={openDrafts}>Go to drafts</button>
                <button type="button" className="btn btn-secondary" onClick={openDrafts}>Edit in drafts</button>
                <button type="button" className="btn btn-danger" onClick={() => void removeActiveDraft()}>Delete post</button>
              </div>
              <div className="toolbar-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn" disabled={draftSaving}>{draftSaving ? 'Saving...' : isReschedule ? 'Reschedule' : 'Schedule'}</button>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}