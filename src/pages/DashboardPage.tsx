import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { formatDateTime } from '../utils/date';
import { EmptyState, StatCard } from '../components/common';

export function DashboardPage() {
  const { products, drafts, aiLogs } = useApp();
  const now = Date.now();
  const published = drafts
    .filter((draft) => draft.status === 'scheduled' && draft.scheduledAt && new Date(draft.scheduledAt).getTime() <= now)
    .sort((a, b) => (b.scheduledAt ?? '').localeCompare(a.scheduledAt ?? ''));
  const scheduled = drafts
    .filter((draft) => draft.status === 'scheduled' && draft.scheduledAt && new Date(draft.scheduledAt).getTime() > now)
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
  const recentDrafts = [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const today = new Date().toDateString();
  const aiToday = aiLogs.filter((log) => new Date(log.createdAt).toDateString() === today).length;

  return (
    <div className="grid" style={{ gap: '1.2rem' }}>
      <section className="grid kpi">
        <StatCard label="Total products" value={products.length} hint="Catalog items currently available" />
        <StatCard label="Total drafts" value={drafts.length} hint="All content drafts in the workspace" />
        <StatCard label="Scheduled posts" value={scheduled.length} hint="Ready for publish timing" />
        <StatCard label="Published posts" value={published.length} hint="Already published based on schedule time" />
        <StatCard label="AI generations today" value={aiToday} hint="Deterministic mock AI activity" />
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Quick actions</h2>
              <p>Fast navigation for demo flow.</p>
            </div>
          </div>
          <div className="grid two">
            <Link className="btn btn-secondary" to="/drafts">New Draft</Link>
            <Link className="btn btn-secondary" to="/products">Add Product</Link>
            <Link className="btn btn-secondary" to="/profile">Edit Profile</Link>
            <Link className="btn btn-secondary" to="/ai-studio">Generate Content</Link>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent drafts</h2>
              <p>Most recently edited content.</p>
            </div>
          </div>
          <div className="stack">
            {recentDrafts.length === 0 ? (
              <EmptyState title="No drafts yet" description="Create your first draft to start the demo." />
            ) : recentDrafts.map((draft) => (
              <article className="card-button panel" key={draft.id}>
                <strong>{draft.title}</strong>
                <p className="muted-text">{draft.platform} • {draft.objective}</p>
                <small className="muted-text">Updated {formatDateTime(draft.updatedAt)}</small>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Upcoming scheduled posts</h2>
              <p>Grouped by priority and timing.</p>
            </div>
          </div>
          {scheduled.length === 0 ? (
            <EmptyState title="Nothing scheduled" description="Move a draft into the schedule to populate this list." />
          ) : (
            <div className="stack">
              {scheduled.map((draft) => (
                <div className="panel" key={draft.id}>
                  <strong>{draft.title}</strong>
                  <p className="muted-text">{draft.platform} • {draft.objective}</p>
                  <small className="pill warning">{formatDateTime(draft.scheduledAt)}</small>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Published posts</h2>
              <p>What has already gone live.</p>
            </div>
          </div>
          {published.length === 0 ? (
            <EmptyState title="No published posts" description="Posts appear here after their scheduled time has passed." />
          ) : (
            <div className="stack">
              {published.slice(0, 6).map((post) => (
                <div className="panel" key={post.id}>
                  <strong>{post.title}</strong>
                  <p className="muted-text">{post.platform} • {post.objective}</p>
                  <small className="pill success">Published {formatDateTime(post.scheduledAt)}</small>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}