import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import type { LoginForm } from '../app/types';
import { FormField } from '../components/common';

const initialForm: LoginForm = { email: 'avery@northstarstudio.com', password: 'demo123' };

export function LoginPage() {
  const { login, session, loginState } = useApp();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <section className="login-hero">
          <div className="login-kicker">Social media operations</div>
          <h1 className="login-title">A premium content workspace for one business, ready to demo.</h1>
          <p className="login-copy">
            Manage profile data, products, drafts, scheduled posts, and AI-generated captions in a polished dark interface with local persistence.
          </p>
          <div className="grid two" style={{ marginTop: '2rem' }}>
            <article className="panel">
              <strong>Protected routes</strong>
              <p className="muted-text">Mock authentication, route guards, and logout cleanup.</p>
            </article>
            <article className="panel">
              <strong>Real demo state</strong>
              <p className="muted-text">Seeded data, editable forms, and localStorage persistence.</p>
            </article>
          </div>
        </section>

        <section className="login-form-panel">
          <h2>Sign in</h2>
          <p className="muted-text">Use any valid email and a password with at least 6 characters.</p>
          <form className="stack" onSubmit={submit}>
            {error ? <div className="panel" style={{ borderColor: 'rgba(248,113,113,0.35)', color: '#ffb4b4' }}>{error}</div> : null}
            <FormField label="Email">
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </FormField>
            <FormField label="Password">
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required minLength={6} />
            </FormField>
            <button className="btn" type="submit" disabled={loginState === 'loading'}>
              {loginState === 'loading' ? 'Signing in...' : 'Enter workspace'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}