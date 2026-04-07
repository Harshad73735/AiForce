import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Camera, ThumbsUp, Briefcase, ImagePlus, Link2, Palette, UploadCloud } from 'lucide-react';
import { useApp } from '../app/AppContext';
import type { ProfileForm } from '../app/types';
import { Alert, FormField } from '../components/common';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read the selected logo.'));
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { profile, saveProfile, profileSaving, accounts, toggleAccountConnection } = useApp();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    businessName: profile.businessName,
    industry: profile.industry,
    tone: profile.tone,
    description: profile.description,
    targetAudience: profile.targetAudience,
    brandVoiceKeywords: profile.brandVoiceKeywords.join(', '),
    logoUrl: profile.logoUrl,
    primaryColor: profile.brandColors.primary,
    secondaryColor: profile.brandColors.secondary,
    accentColor: profile.brandColors.accent,
    backgroundColor: profile.brandColors.background,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      businessName: profile.businessName,
      industry: profile.industry,
      tone: profile.tone,
      description: profile.description,
      targetAudience: profile.targetAudience,
      brandVoiceKeywords: profile.brandVoiceKeywords.join(', '),
      logoUrl: profile.logoUrl,
      primaryColor: profile.brandColors.primary,
      secondaryColor: profile.brandColors.secondary,
      accentColor: profile.brandColors.accent,
      backgroundColor: profile.brandColors.background,
    });
  }, [profile]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.businessName.trim() || !form.description.trim()) {
      setError('Business name and description are required.');
      return;
    }

    try {
      await saveProfile(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const url = await readFileAsDataUrl(file);
      setForm((current) => ({ ...current, logoUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed.');
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>Business Profile</h2>
            <p>Define the brand voice, visuals, and connected channels for the workspace.</p>
          </div>
        </div>

        {error ? <Alert kind="error" title="Profile update failed" description={error} /> : null}

        <form className="grid two" onSubmit={submit}>
          <FormField label="Business name">
            <input value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} />
          </FormField>
          <FormField label="Industry">
            <select value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value as ProfileForm['industry'] }))}>
              {['Restaurant', 'Fashion', 'Fitness', 'Real Estate', 'Salon', 'Education'].map((industry) => (
                <option key={industry}>{industry}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Brand tone">
            <select value={form.tone} onChange={(event) => setForm((current) => ({ ...current, tone: event.target.value as ProfileForm['tone'] }))}>
              {['Professional', 'Friendly', 'Bold', 'Luxury', 'Playful'].map((tone) => (
                <option key={tone}>{tone}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Target audience">
            <input value={form.targetAudience} onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))} />
          </FormField>
          <FormField label="Business description">
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </FormField>
          <FormField label="Brand voice keywords" help="Comma-separated values">
            <input value={form.brandVoiceKeywords} onChange={(event) => setForm((current) => ({ ...current, brandVoiceKeywords: event.target.value }))} />
          </FormField>

          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-header">
              <div className="subtitle-row">
                <Palette size={18} />
                <div>
                  <h3>Brand kit</h3>
                  <p>Logo and color tokens used across the dashboard, drafts, and AI assets.</p>
                </div>
              </div>
            </div>

            <div className="grid two">
              <div className="stack">
                <div className="logo-preview">
                  {form.logoUrl ? <img src={form.logoUrl} alt="Brand logo preview" /> : <ImagePlus size={28} className="muted-text" />}
                </div>
                <div className="media-actions">
                  <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UploadCloud size={16} />
                    Upload logo
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        void handleLogoUpload(event.target.files?.[0] ?? null);
                      }}
                    />
                  </label>
                  <button type="button" className="btn btn-secondary" onClick={() => setForm((current) => ({ ...current, logoUrl: '' }))}>
                    Reset logo
                  </button>
                </div>
              </div>

              <div className="stack">
                <div className="swatch-grid">
                  {[
                    { label: 'Primary', key: 'primaryColor' as const },
                    { label: 'Secondary', key: 'secondaryColor' as const },
                    { label: 'Accent', key: 'accentColor' as const },
                    { label: 'Background', key: 'backgroundColor' as const },
                  ].map((entry) => (
                    <label key={entry.key} className="stack" style={{ minWidth: '160px', flex: '1 1 160px' }}>
                      <span className="field-label">{entry.label}</span>
                      <div className="subtitle-row">
                        <span className="color-swatch" style={{ background: form[entry.key] }} />
                        <input type="color" value={form[entry.key]} onChange={(event) => setForm((current) => ({ ...current, [entry.key]: event.target.value }))} />
                      </div>
                    </label>
                  ))}
                </div>
                <div className="chip-row">
                  <span className="chip">Primary: {form.primaryColor}</span>
                  <span className="chip">Secondary: {form.secondaryColor}</span>
                  <span className="chip">Accent: {form.accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save profile'}</button>
          </div>
        </form>
      </article>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Connected accounts</h3>
            <p>Connect the business profile to each social channel used for publishing.</p>
          </div>
        </div>

        <div className="account-grid">
          {accounts.map((account) => {
            const Icon = account.platform === 'instagram' ? Camera : account.platform === 'facebook' ? ThumbsUp : Briefcase;

            return (
              <article className="account-card reveal" key={account.platform}>
                <div className="subtitle-row" style={{ marginBottom: '0.75rem' }}>
                  <span className="color-swatch" style={{ background: account.accountColor }} />
                  <Icon size={18} />
                  <div>
                    <strong>{account.label}</strong>
                    <p className="muted-text">{account.handle}</p>
                  </div>
                </div>
                <div className="account-status" style={{ marginBottom: '1rem' }}>
                  <span className={`account-dot ${account.connected ? '' : 'off'}`} />
                  <span className="muted-text">{account.connected ? 'Connected' : 'Not connected'}</span>
                </div>
                <div className="account-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => toggleAccountConnection(account.platform)}>
                    <Link2 size={16} />
                    {account.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}