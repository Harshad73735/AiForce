import { StatCard } from '../components/common';
import { useApp } from '../app/AppContext';
import { Fragment } from 'react';

type PlatformRow = {
  label: string;
  visits: number;
  likes: number;
  dislikes: number;
};

const platformLabels = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
} as const;

const objectiveWeight = {
  promotion: 1.3,
  education: 1.05,
  engagement: 1.45,
} as const;

function formatCompact(value: number) {
  return value.toLocaleString();
}

export function OverviewPage() {
  const { drafts, aiLogs, products, media } = useApp();

  const platformStats = drafts.reduce<Record<keyof typeof platformLabels, PlatformRow>>(
    (acc, draft) => {
      const weight = objectiveWeight[draft.objective];
      const baseReach = 320 + draft.hashtags.length * 45 + draft.mediaIds.length * 80;
      const statusBoost = draft.status === 'scheduled' ? 1.25 : 0.92;
      const modeBoost = draft.contentMode === 'both' ? 1.18 : draft.contentMode === 'image' ? 1.1 : 1;
      const visits = Math.round(baseReach * weight * statusBoost * modeBoost);
      const likes = Math.round(visits * (0.21 + draft.hashtags.length * 0.01));
      const dislikes = Math.max(2, Math.round(likes * 0.07));

      const platform = draft.platform;
      acc[platform] = {
        ...acc[platform],
        visits: acc[platform].visits + visits,
        likes: acc[platform].likes + likes,
        dislikes: acc[platform].dislikes + dislikes,
      };

      return acc;
    },
    {
      instagram: { label: platformLabels.instagram, visits: 0, likes: 0, dislikes: 0 },
      facebook: { label: platformLabels.facebook, visits: 0, likes: 0, dislikes: 0 },
      linkedin: { label: platformLabels.linkedin, visits: 0, likes: 0, dislikes: 0 },
    },
  );

  const rows = Object.values(platformStats);
  const contentBonus = aiLogs.length * 60 + media.length * 85 + products.length * 40;
  const totalVisits = rows.reduce((sum, item) => sum + item.visits, 0) + contentBonus;
  const totalLikes = rows.reduce((sum, item) => sum + item.likes, 0) + Math.round(aiLogs.length * 7.5);
  const totalDislikes = rows.reduce((sum, item) => sum + item.dislikes, 0) + Math.max(2, Math.round(drafts.length * 0.8));

  const engagementRate = totalVisits > 0 ? ((totalLikes / totalVisits) * 100).toFixed(1) : '0.0';
  const sentimentScore = totalLikes > 0 ? (((totalLikes - totalDislikes) / totalLikes) * 100).toFixed(1) : '0.0';

  const chartSeries = rows.map((item) => ({
    label: item.label,
    value: item.likes,
  }));
  const maxChartValue = Math.max(1, ...chartSeries.map((item) => item.value));

  return (
    <div className="grid" style={{ gap: '1.2rem' }}>
      <section className="grid kpi">
        <StatCard label="Total likes" value={formatCompact(totalLikes)} hint="Estimated reactions from all channels" />
        <StatCard label="Total dislikes" value={formatCompact(totalDislikes)} hint="Negative feedback and hidden reactions" />
        <StatCard label="Total visits" value={formatCompact(totalVisits)} hint="All profile and post view traffic" />
        <StatCard label="Engagement rate" value={`${engagementRate}%`} hint="Likes as a share of total visits" />
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Channel performance</h2>
              <p>Likes distribution by platform.</p>
            </div>
            <span className="pill success">Sentiment {sentimentScore}%</span>
          </div>

          <div className="overview-chart">
            {chartSeries.map((entry) => {
              const height = Math.max(12, Math.round((entry.value / maxChartValue) * 100));
              return (
                <div className="overview-chart-col" key={entry.label}>
                  <div className="overview-bar-track">
                    <div className="overview-bar-fill" style={{ height: `${height}%` }} />
                  </div>
                  <strong>{entry.label}</strong>
                  <small className="muted-text">{formatCompact(entry.value)} likes</small>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Overview breakdown</h2>
              <p>Visits, likes, and dislikes by channel.</p>
            </div>
          </div>

          <div className="overview-table">
            <div className="overview-table-head">Channel</div>
            <div className="overview-table-head">Visits</div>
            <div className="overview-table-head">Likes</div>
            <div className="overview-table-head">Dislikes</div>
            {rows.map((row) => (
              <Fragment key={row.label}>
                <div className="overview-table-cell">
                  <strong>{row.label}</strong>
                </div>
                <div className="overview-table-cell">{formatCompact(row.visits)}</div>
                <div className="overview-table-cell">{formatCompact(row.likes)}</div>
                <div className="overview-table-cell">{formatCompact(row.dislikes)}</div>
              </Fragment>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
