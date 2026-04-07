import type { AppState, BusinessProfile, ConnectedAccount, DraftPost, MediaAsset, Product, Session } from '../app/types';

function svgData(title: string, primary: string, secondary: string, accent: string) {
  const markup = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="52%" stop-color="${secondary}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="120" fill="#08111f" />
      <circle cx="190" cy="180" r="170" fill="url(#g)" fill-opacity="0.32" />
      <circle cx="620" cy="220" r="170" fill="url(#g)" fill-opacity="0.24" />
      <rect x="110" y="330" width="580" height="250" rx="54" fill="url(#g)" fill-opacity="0.18" stroke="url(#g)" stroke-width="4" />
      <text x="400" y="430" fill="#F8FAFC" font-size="56" font-family="Inter, Arial, sans-serif" text-anchor="middle" font-weight="700">${title}</text>
      <text x="400" y="495" fill="#BAE6FD" font-size="28" font-family="Inter, Arial, sans-serif" text-anchor="middle">Premium social content preview</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

const now = new Date();
const days = (value: number) => new Date(now.getTime() + value * 86_400_000).toISOString();

const profile: BusinessProfile = {
  businessName: 'Northstar Studio',
  industry: 'Fashion',
  tone: 'Luxury',
  description: 'A premium boutique helping customers build elevated everyday wardrobes.',
  targetAudience: 'Professionals and founders who want polished, versatile style.',
  brandVoiceKeywords: ['premium', 'editorial', 'confident', 'clean'],
  brandColors: {
    primary: '#2563EB',
    secondary: '#1F2937',
    accent: '#38BDF8',
    background: '#0B1020',
  },
  logoUrl: svgData('NS', '#2563EB', '#1F2937', '#38BDF8'),
  updatedAt: now.toISOString(),
};

const products: Product[] = [
  { id: 'prod_1', name: 'Tailored Linen Blazer', description: 'Lightweight structure for warm-weather layering.', category: 'Outerwear', price: 184, createdAt: days(-14) },
  { id: 'prod_2', name: 'Silk Signature Blouse', description: 'Soft drape with polished finish for office-to-evening wear.', category: 'Tops', price: 128, createdAt: days(-11) },
  { id: 'prod_3', name: 'Modern Straight Trousers', description: 'High-rise silhouette built for all-day comfort.', category: 'Bottoms', price: 142, createdAt: days(-8) },
  { id: 'prod_4', name: 'Minimal Leather Tote', description: 'Structured carryall with refined hardware.', category: 'Accessories', price: 210, createdAt: days(-4) },
];

const drafts: DraftPost[] = [
  {
    id: 'draft_1',
    title: 'Weekend wardrobe spotlight',
    objective: 'promotion',
    platform: 'instagram',
    contentMode: 'both',
    caption: 'A refined uniform for every day.',
    hashtags: ['#luxurystyle', '#modernwardrobe', '#editorialfashion'],
    productId: 'prod_1',
    mediaIds: ['media_1'],
    status: 'scheduled',
    scheduledAt: days(1),
    createdAt: days(-9),
    updatedAt: days(-2),
  },
  {
    id: 'draft_2',
    title: 'Why quality fabrics matter',
    objective: 'education',
    platform: 'linkedin',
    contentMode: 'caption',
    caption: 'Premium fabric changes how a brand feels.',
    hashtags: ['#brandstory', '#productquality'],
    productId: 'prod_2',
    mediaIds: [],
    status: 'draft',
    scheduledAt: null,
    createdAt: days(-7),
    updatedAt: days(-1),
  },
  {
    id: 'draft_3',
    title: 'Client styling reel',
    objective: 'engagement',
    platform: 'instagram',
    contentMode: 'both',
    caption: 'Three ways to style one core piece.',
    hashtags: ['#stylingtips', '#capsulewardrobe'],
    productId: 'prod_3',
    mediaIds: ['media_2', 'media_3'],
    status: 'scheduled',
    scheduledAt: days(2),
    createdAt: days(-6),
    updatedAt: days(-1),
  },
  {
    id: 'draft_4',
    title: 'Founder note',
    objective: 'education',
    platform: 'facebook',
    contentMode: 'caption',
    caption: 'We design each piece to move from meeting to dinner.',
    hashtags: ['#founderstory', '#slowfashion'],
    productId: null,
    mediaIds: [],
    status: 'draft',
    scheduledAt: null,
    createdAt: days(-5),
    updatedAt: days(-3),
  },
  {
    id: 'draft_5',
    title: 'Accessory launch teaser',
    objective: 'promotion',
    platform: 'instagram',
    contentMode: 'image',
    caption: 'A finishing touch that does the heavy lifting.',
    hashtags: ['#accessories', '#newdrop'],
    productId: 'prod_4',
    mediaIds: ['media_4'],
    status: 'draft',
    scheduledAt: null,
    createdAt: days(-2),
    updatedAt: days(-2),
  },
  {
    id: 'draft_6',
    title: 'Weekly style poll',
    objective: 'engagement',
    platform: 'facebook',
    contentMode: 'caption',
    caption: 'Which look should we break down in tomorrow\'s post?',
    hashtags: ['#stylepoll', '#communitypick'],
    productId: null,
    mediaIds: [],
    status: 'draft',
    scheduledAt: null,
    createdAt: days(-1),
    updatedAt: days(-1),
  },
  {
    id: 'draft_7',
    title: 'New arrivals carousel',
    objective: 'promotion',
    platform: 'instagram',
    contentMode: 'both',
    caption: 'Swipe through this week\'s latest studio arrivals.',
    hashtags: ['#newarrivals', '#northstarstudio', '#capsuleedit'],
    productId: 'prod_2',
    mediaIds: ['media_5'],
    status: 'scheduled',
    scheduledAt: days(3),
    createdAt: days(-1),
    updatedAt: days(0),
  },
];

const media: MediaAsset[] = [
  { id: 'media_1', name: 'Blazer launch', url: svgData('BL', '#2563EB', '#1F2937', '#38BDF8'), type: 'image', source: 'upload', createdAt: days(-12) },
  { id: 'media_2', name: 'Studio portrait', url: svgData('SP', '#0F172A', '#1D4ED8', '#38BDF8'), type: 'image', source: 'upload', createdAt: days(-9) },
  { id: 'media_3', name: 'Lifestyle flatlay', url: svgData('LF', '#111827', '#16A34A', '#22C55E'), type: 'image', source: 'generated', createdAt: days(-7) },
  { id: 'media_4', name: 'Accessory close-up', url: svgData('AC', '#111827', '#B45309', '#F59E0B'), type: 'image', source: 'generated', createdAt: days(-3) },
  { id: 'media_5', name: 'New arrivals banner', url: svgData('NA', '#172554', '#1D4ED8', '#38BDF8'), type: 'image', source: 'upload', createdAt: days(-1) },
];

const accounts: ConnectedAccount[] = [
  { platform: 'instagram', label: 'Instagram', handle: '@northstarstudio', connected: true, accountColor: '#E1306C', icon: 'instagram' },
  { platform: 'facebook', label: 'Facebook', handle: 'Northstar Studio', connected: false, accountColor: '#1877F2', icon: 'facebook' },
  { platform: 'linkedin', label: 'LinkedIn', handle: 'Northstar Studio', connected: true, accountColor: '#0A66C2', icon: 'linkedin' },
];

export const initialAiLogs = [
  { id: 'ai_1', promptSummary: 'Instagram promotion for blazer', outputPreview: 'Make the blazer feel effortless yet elevated.', createdAt: days(-3) },
  { id: 'ai_2', promptSummary: 'LinkedIn education post', outputPreview: 'Explain why fabric quality changes brand perception.', createdAt: days(-4) },
  { id: 'ai_3', promptSummary: 'Facebook engagement idea', outputPreview: 'Invite the audience to pick their favorite look.', createdAt: days(-5) },
  { id: 'ai_4', promptSummary: 'Product launch caption', outputPreview: 'Position the tote as a polished everyday essential.', createdAt: days(-6) },
  { id: 'ai_5', promptSummary: 'Styling tips series', outputPreview: 'Create three short caption variants with premium tone.', createdAt: days(-7) },
  { id: 'ai_6', promptSummary: 'Founder story draft', outputPreview: 'Tell a concise story about attention to detail.', createdAt: days(-8) },
];

export function createSeedState(): AppState {
  return {
    session: null,
    profile,
    products,
    drafts,
    aiLogs: initialAiLogs,
    media,
    accounts,
  };
}

export const demoSession: Session = {
  user: {
    id: 'user_1',
    name: 'Avery Stone',
    email: 'avery@northstarstudio.com',
  },
};