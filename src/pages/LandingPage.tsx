import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function LandingPage() {
  const { session } = useApp();

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="landing-kicker">Social SaaS Demo</p>
        <h1>Plan, Generate, and Schedule Posts in Minutes</h1>
        <p className="landing-subtitle">
          Quick demo workspace for profile setup, AI content generation, draft editing, and calendar scheduling.
        </p>
        <div className="landing-actions">
          <Link className="btn" to={session ? '/dashboard' : '/login'}>
            {session ? 'Open Dashboard' : 'Get Started'}
          </Link>
          <Link className="btn btn-secondary" to="/overview">
            View Overview
          </Link>
        </div>
      </section>

      <section className="landing-grid">
        <article className="panel">
          <h3>AI Studio</h3>
          <p>Create caption and visual concepts with mock AI and save them as drafts instantly.</p>
        </article>
        <article className="panel">
          <h3>Draft Workflow</h3>
          <p>Edit, duplicate, and enrich drafts with media before you schedule anything.</p>
        </article>
        <article className="panel">
          <h3>Calendar Scheduling</h3>
          <p>Assign future publish time and track upcoming scheduled posts in a monthly view.</p>
        </article>
      </section>
    </main>
  );
}
