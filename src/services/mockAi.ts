import type { AiForm, AppState, DraftPost } from '../app/types';

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function createRng(seed: number) {
  let current = seed || 1;
  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
}

function pick<T>(list: T[], rng: () => number) {
  return list[Math.floor(rng() * list.length)];
}

export type AiResponse = {
  mainCaption: string;
  alternatives: string[];
  hashtags: string[];
  imagePrompt: string;
  imagePreviewUrl: string;
  palette: string[];
  outputPreview: string;
};

function buildPreviewSvg(title: string, palette: string[]) {
  const [primary, secondary, accent] = palette;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#08111f" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="50%" stop-color="${secondary}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" rx="120" fill="url(#bg)" />
      <circle cx="250" cy="250" r="180" fill="url(#accent)" fill-opacity="0.3" />
      <circle cx="920" cy="260" r="200" fill="url(#accent)" fill-opacity="0.22" />
      <rect x="180" y="340" width="840" height="520" rx="52" fill="url(#accent)" fill-opacity="0.13" stroke="url(#accent)" stroke-width="4" />
      <rect x="260" y="410" width="680" height="36" rx="18" fill="#E2E8F0" fill-opacity="0.4" />
      <rect x="260" y="470" width="460" height="24" rx="12" fill="#E2E8F0" fill-opacity="0.22" />
      <rect x="260" y="540" width="560" height="220" rx="36" fill="url(#accent)" fill-opacity="0.18" />
      <text x="600" y="860" fill="#F8FAFC" font-size="52" font-family="Inter, Arial, sans-serif" text-anchor="middle" font-weight="700">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function generateMockAi(state: AppState, input: AiForm): Promise<AiResponse> {
  const profile = state.profile;
  const product = input.productId ? state.products.find((entry) => entry.id === input.productId) : undefined;
  const seed = hashString([profile.businessName, profile.industry, profile.tone, input.objective, input.platform, product?.name ?? '', input.customInstruction].join('|'));
  const rng = createRng(seed);
  const delay = 800 + Math.floor(rng() * 700);

  await new Promise((resolve) => window.setTimeout(resolve, delay));

  const voiceLead = pick(['Refined', 'Confident', 'Thoughtful', 'Polished', 'Crisp'], rng);
  const objectiveText = {
    promotion: 'highlight a premium offer',
    education: 'share a useful brand insight',
    engagement: 'invite a sharper conversation',
  }[input.objective];
  const platformText = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
  }[input.platform];
  const outputModeText = {
    caption: 'caption only',
    image: 'image concept only',
    both: 'combined caption and image concept',
  }[input.outputMode];
  const productText = product ? `${product.name}` : profile.businessName;
  const instructionText = input.customInstruction.trim();
  const base = `${voiceLead} ${profile.tone.toLowerCase()} ${outputModeText} for ${platformText} that helps ${profile.businessName} ${objectiveText}${product ? ` around ${productText}` : ''}.`;

  const mainCaption = [
    `${base} ${profile.description}`,
    instructionText ? `Angle: ${instructionText}` : '',
    product ? `Focus: ${product.description}` : '',
  ].filter(Boolean).join(' ');

  const alternatives = [
    `${profile.businessName} is where ${profile.industry.toLowerCase()} meets ${profile.tone.toLowerCase()} execution. ${product ? `Spotlight: ${product.name}.` : 'A story worth sharing.'}`,
    `${platformText} caption idea: make the value obvious, keep the message premium, and end with a clear next step.`,
    `${profile.brandVoiceKeywords.slice(0, 3).join(' • ')}. ${instructionText || 'Clean positioning, strong hook, and a useful takeaway.'}`,
  ];

  const baseTags = {
    Restaurant: ['#foodbrand', '#localbusiness', '#hospitality'],
    Fashion: ['#fashionbrand', '#styleedit', '#luxuryfashion'],
    Fitness: ['#fitnessbrand', '#wellnesstips', '#trainingday'],
    'Real Estate': ['#realestatebrand', '#propertymarketing', '#listinglaunch'],
    Salon: ['#salonbrand', '#beautybusiness', '#clientexperience'],
    Education: ['#edtech', '#learningjourney', '#studentsuccess'],
  }[profile.industry];

  const objectiveTags = {
    promotion: ['#newarrival', '#productspotlight', '#shopnow'],
    education: ['#brandinsight', '#howitworks', '#businesstips'],
    engagement: ['#communitytalk', '#yourthoughts', '#jointhestring'],
  }[input.objective];

  const platformTags = {
    instagram: ['#instagrammarketing', '#visualstory'],
    facebook: ['#facebookcontent', '#communitybuilding'],
    linkedin: ['#linkedincontent', '#businesstips'],
  }[input.platform];

  const productTags = product
    ? [`#${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}`, `#${product.category.toLowerCase().replace(/[^a-z0-9]+/g, '')}`]
    : [];

  const hashtags = Array.from(new Set([...baseTags, ...objectiveTags, ...platformTags, ...productTags])).slice(0, 8);
  const palette = [profile.brandColors.primary, profile.brandColors.secondary, profile.brandColors.accent];
  const imagePrompt = `${profile.businessName} ${input.outputMode} concept for ${platformText}${product ? ` featuring ${product.name}` : ''}`;
  const imagePreviewUrl = buildPreviewSvg(product?.name ?? profile.businessName, palette);

  return {
    mainCaption,
    alternatives,
    hashtags,
    imagePrompt,
    imagePreviewUrl,
    palette,
    outputPreview: mainCaption.slice(0, 160),
  };
}

export function buildAiPromptSummary(input: AiForm, draft?: DraftPost, productName?: string) {
  return `${input.platform} ${input.objective}${productName ? ` for ${productName}` : ''}${draft ? ` | draft: ${draft.title}` : ''}`;
}