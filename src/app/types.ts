export type Session = {
  user: User;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type BusinessProfile = {
  businessName: string;
  industry: Industry;
  tone: Tone;
  description: string;
  targetAudience: string;
  brandVoiceKeywords: string[];
  brandColors: BrandColors;
  logoUrl: string;
  updatedAt: string;
};

export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  createdAt: string;
};

export type DraftStatus = 'draft' | 'scheduled';

export type DraftPost = {
  id: string;
  title: string;
  objective: Objective;
  platform: Platform;
  contentMode: AiOutputMode;
  caption: string;
  hashtags: string[];
  productId: string | null;
  mediaIds: string[];
  status: DraftStatus;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  type: 'image';
  source: 'upload' | 'generated';
  createdAt: string;
};

export type ConnectedAccount = {
  platform: Platform;
  label: string;
  handle: string;
  connected: boolean;
  accountColor: string;
  icon: string;
};

export type AiGenerationLog = {
  id: string;
  promptSummary: string;
  outputPreview: string;
  createdAt: string;
};

export type Industry = 'Restaurant' | 'Fashion' | 'Fitness' | 'Real Estate' | 'Salon' | 'Education';
export type Tone = 'Professional' | 'Friendly' | 'Bold' | 'Luxury' | 'Playful';
export type Objective = 'promotion' | 'education' | 'engagement';
export type Platform = 'instagram' | 'facebook' | 'linkedin';

export type AppState = {
  session: Session | null;
  profile: BusinessProfile;
  products: Product[];
  drafts: DraftPost[];
  aiLogs: AiGenerationLog[];
  media: MediaAsset[];
  accounts: ConnectedAccount[];
};

export type LoginForm = {
  email: string;
  password: string;
};

export type ProfileForm = {
  businessName: string;
  industry: Industry;
  tone: Tone;
  description: string;
  targetAudience: string;
  brandVoiceKeywords: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
};

export type ProductForm = {
  name: string;
  description: string;
  category: string;
  price: string;
};

export type DraftForm = {
  title: string;
  objective: Objective;
  platform: Platform;
  contentMode: AiOutputMode;
  caption: string;
  productId: string;
  hashtags: string;
  mediaIds: string[];
};

export type ScheduleForm = {
  scheduledAt: string;
};

export type AiForm = {
  objective: Objective;
  platform: Platform;
  outputMode: AiOutputMode;
  productId: string;
  customInstruction: string;
  selectedMediaId: string;
};

export type AiOutputMode = 'caption' | 'image' | 'both';