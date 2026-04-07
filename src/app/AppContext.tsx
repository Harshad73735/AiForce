import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AiGenerationLog,
  AiForm,
  AppState,
  AiOutputMode,
  BusinessProfile,
  ConnectedAccount,
  DraftForm,
  DraftPost,
  LoginForm,
  MediaAsset,
  Product,
  ProductForm,
  ProfileForm,
  ScheduleForm,
  Session,
  Platform,
  User,
} from './types';
import { createSeedState, demoSession } from '../data/seed';
import { clearStorageKey, loadJson, saveJson } from '../utils/storage';
import { buildAiPromptSummary, generateMockAi } from '../services/mockAi';

const SESSION_KEY = 'session';
const PROFILE_KEY = 'profile';
const PRODUCTS_KEY = 'products';
const DRAFTS_KEY = 'drafts';
const AI_LOGS_KEY = 'aiLogs';
const MEDIA_KEY = 'media';
const ACCOUNTS_KEY = 'accounts';

type ToastKind = 'success' | 'error' | 'info';

type ToastMessage = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

type EditorState = {
  draftId: string | null;
  form: DraftForm;
};

type AppContextValue = {
  session: Session | null;
  profile: BusinessProfile;
  products: Product[];
  drafts: DraftPost[];
  aiLogs: AiGenerationLog[];
  media: MediaAsset[];
  accounts: ConnectedAccount[];
  toasts: ToastMessage[];
  isHydrated: boolean;
  loginState: 'idle' | 'loading';
  profileSaving: boolean;
  productSaving: boolean;
  draftSaving: boolean;
  aiGenerating: boolean;
  login: (form: LoginForm) => Promise<void>;
  logout: () => void;
  saveProfile: (form: ProfileForm) => Promise<void>;
  createProduct: (form: ProductForm) => Promise<void>;
  updateProduct: (id: string, form: ProductForm) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createDraft: (form: DraftForm) => Promise<DraftPost>;
  updateDraft: (id: string, form: DraftForm) => Promise<void>;
  duplicateDraft: (id: string) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  scheduleDraft: (id: string, form: ScheduleForm) => Promise<void>;
  unscheduleDraft: (id: string) => Promise<void>;
  generateContent: (form: AiForm) => Promise<{
    mainCaption: string;
    alternatives: string[];
    hashtags: string[];
    imagePrompt: string;
    imagePreviewUrl: string;
    palette: string[];
  }>;
  applyCaptionToDraft: (draftId: string, caption: string, hashtags: string[]) => Promise<void>;
  openDraftEditor: (draft: DraftPost | null) => void;
  draftEditor: EditorState;
  updateDraftEditor: (form: Partial<DraftForm>) => void;
  resetDraftEditor: () => void;
  toggleAccountConnection: (platform: Platform) => void;
  uploadMedia: (files: FileList | File[]) => Promise<void>;
  saveGeneratedMedia: (name: string, url: string) => Promise<MediaAsset>;
  deleteMedia: (id: string) => Promise<void>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseKeywords(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function profileToForm(profile: BusinessProfile): ProfileForm {
  return {
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
  };
}

function draftToForm(draft: DraftPost): DraftForm {
  return {
    title: draft.title,
    objective: draft.objective,
    platform: draft.platform,
    contentMode: draft.contentMode,
    caption: draft.caption,
    productId: draft.productId ?? '',
    hashtags: draft.hashtags.join(', '),
    mediaIds: draft.mediaIds,
  };
}

function defaultDraftForm(): DraftForm {
  return {
    title: '',
    objective: 'promotion',
    platform: 'instagram',
    contentMode: 'caption',
    caption: '',
    productId: '',
    hashtags: '',
    mediaIds: [],
  };
}

function loadState(): AppState {
  const seed = createSeedState();
  const loadedProfile = loadJson<Partial<BusinessProfile>>(PROFILE_KEY, seed.profile);
  const loadedProducts = loadJson<Partial<Product>[]>(PRODUCTS_KEY, seed.products);
  const loadedDrafts = loadJson<Partial<DraftPost>[]>(DRAFTS_KEY, seed.drafts);
  const loadedMedia = loadJson<Partial<MediaAsset>[]>(MEDIA_KEY, seed.media);
  const loadedAccounts = loadJson<Partial<ConnectedAccount>[]>(ACCOUNTS_KEY, seed.accounts);

  const profile: BusinessProfile = {
    ...seed.profile,
    ...loadedProfile,
    brandVoiceKeywords: Array.isArray(loadedProfile.brandVoiceKeywords)
      ? loadedProfile.brandVoiceKeywords.filter((entry): entry is string => typeof entry === 'string')
      : seed.profile.brandVoiceKeywords,
    brandColors: {
      ...seed.profile.brandColors,
      ...(loadedProfile.brandColors ?? {}),
    },
    logoUrl: typeof loadedProfile.logoUrl === 'string' ? loadedProfile.logoUrl : seed.profile.logoUrl,
  };

  const products = (Array.isArray(loadedProducts) ? loadedProducts : seed.products).map((entry, index) => ({
    id: typeof entry.id === 'string' ? entry.id : `prod_migrated_${index}`,
    name: typeof entry.name === 'string' ? entry.name : 'Untitled product',
    description: typeof entry.description === 'string' ? entry.description : '',
    category: typeof entry.category === 'string' ? entry.category : 'General',
    price: typeof entry.price === 'number' ? entry.price : Number(entry.price ?? 0),
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
  }));

  const drafts = (Array.isArray(loadedDrafts) ? loadedDrafts : seed.drafts).map((entry, index): DraftPost => ({
    id: typeof entry.id === 'string' ? entry.id : `draft_migrated_${index}`,
    title: typeof entry.title === 'string' ? entry.title : 'Untitled draft',
    objective: entry.objective === 'promotion' || entry.objective === 'education' || entry.objective === 'engagement' ? entry.objective : 'promotion',
    platform: entry.platform === 'instagram' || entry.platform === 'facebook' || entry.platform === 'linkedin' ? entry.platform : 'instagram',
    contentMode: entry.contentMode === 'caption' || entry.contentMode === 'image' || entry.contentMode === 'both' ? entry.contentMode : 'caption',
    caption: typeof entry.caption === 'string' ? entry.caption : '',
    hashtags: Array.isArray(entry.hashtags) ? entry.hashtags.filter((tag): tag is string => typeof tag === 'string') : [],
    productId: typeof entry.productId === 'string' ? entry.productId : null,
    mediaIds: Array.isArray(entry.mediaIds) ? entry.mediaIds.filter((id): id is string => typeof id === 'string') : [],
    status: entry.status === 'scheduled' ? 'scheduled' : 'draft',
    scheduledAt: typeof entry.scheduledAt === 'string' ? entry.scheduledAt : null,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : new Date().toISOString(),
  }));

  const media = (Array.isArray(loadedMedia) ? loadedMedia : seed.media).map((entry, index): MediaAsset => ({
    id: typeof entry.id === 'string' ? entry.id : `media_migrated_${index}`,
    name: typeof entry.name === 'string' ? entry.name : `Media ${index + 1}`,
    url: typeof entry.url === 'string' ? entry.url : '',
    type: 'image' as const,
    source: entry.source === 'generated' ? 'generated' : 'upload',
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
  })).filter((asset) => asset.url.trim().length > 0);

  const accounts = (Array.isArray(loadedAccounts) ? loadedAccounts : seed.accounts).map((entry) => ({
    platform: entry.platform === 'instagram' || entry.platform === 'facebook' || entry.platform === 'linkedin' ? entry.platform : 'instagram',
    label: typeof entry.label === 'string' ? entry.label : 'Account',
    handle: typeof entry.handle === 'string' ? entry.handle : '',
    connected: Boolean(entry.connected),
    accountColor: typeof entry.accountColor === 'string' ? entry.accountColor : '#334155',
    icon: typeof entry.icon === 'string' ? entry.icon : 'link',
  }));

  return {
    session: loadJson<Session | null>(SESSION_KEY, null),
    profile,
    products,
    drafts,
    aiLogs: loadJson<AiGenerationLog[]>(AI_LOGS_KEY, seed.aiLogs),
    media,
    accounts,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function createMediaId() {
  return uid('media');
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [loginState, setLoginState] = useState<'idle' | 'loading'>('idle');
  const [profileSaving, setProfileSaving] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [draftEditor, setDraftEditor] = useState<EditorState>({ draftId: null, form: defaultDraftForm() });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveJson(SESSION_KEY, state.session);
    saveJson(PROFILE_KEY, state.profile);
    saveJson(PRODUCTS_KEY, state.products);
    saveJson(DRAFTS_KEY, state.drafts);
    saveJson(AI_LOGS_KEY, state.aiLogs);
    saveJson(MEDIA_KEY, state.media);
    saveJson(ACCOUNTS_KEY, state.accounts);
  }, [isHydrated, state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setToasts((current) => current.slice(0, 4));
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [toasts]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    setToasts((current) => [{ ...toast, id: uid('toast') }, ...current].slice(0, 4));
  };

  const dismissToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const login = async (form: LoginForm) => {
    if (!/^\S+@\S+\.\S+$/.test(form.email) || form.password.length < 6) {
      throw new Error('Enter a valid email and a password with at least 6 characters.');
    }

    setLoginState('loading');
    await sleep(700);
    setState((current: AppState) => ({ ...current, session: demoSession }));
    setLoginState('idle');
    addToast({ kind: 'success', title: 'Logged in', description: 'Session saved locally for this demo.' });
  };

  const logout = () => {
    clearStorageKey(SESSION_KEY);
    setState((current: AppState) => ({ ...current, session: null }));
    setDraftEditor({ draftId: null, form: defaultDraftForm() });
    addToast({ kind: 'info', title: 'Logged out', description: 'Local session cleared.' });
  };

  const saveProfile = async (form: ProfileForm) => {
    setProfileSaving(true);
    await sleep(600);
    setState((current: AppState) => ({
      ...current,
      profile: {
        businessName: form.businessName.trim(),
        industry: form.industry,
        tone: form.tone,
        description: form.description.trim(),
        targetAudience: form.targetAudience.trim(),
        brandVoiceKeywords: parseKeywords(form.brandVoiceKeywords),
        logoUrl: form.logoUrl.trim(),
        brandColors: {
          primary: form.primaryColor,
          secondary: form.secondaryColor,
          accent: form.accentColor,
          background: form.backgroundColor,
        },
        updatedAt: new Date().toISOString(),
      },
    }));
    setProfileSaving(false);
    addToast({ kind: 'success', title: 'Profile saved', description: 'Business profile updated.' });
  };

  const createProduct = async (form: ProductForm) => {
    setProductSaving(true);
    await sleep(500);
    const product: Product = {
      id: uid('prod'),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      createdAt: new Date().toISOString(),
    };
    setState((current: AppState) => ({ ...current, products: [product, ...current.products] }));
    setProductSaving(false);
    addToast({ kind: 'success', title: 'Product created' });
  };

  const updateProduct = async (id: string, form: ProductForm) => {
    setProductSaving(true);
    await sleep(500);
    setState((current: AppState) => ({
      ...current,
      products: current.products.map((entry) =>
        entry.id === id
          ? { ...entry, name: form.name.trim(), description: form.description.trim(), category: form.category.trim(), price: Number(form.price) }
          : entry,
      ),
    }));
    setProductSaving(false);
    addToast({ kind: 'success', title: 'Product updated' });
  };

  const deleteProduct = async (id: string) => {
    setProductSaving(true);
    await sleep(400);
    setState((current: AppState) => ({
      ...current,
      products: current.products.filter((entry) => entry.id !== id),
      drafts: current.drafts.map((draft) => (draft.productId === id ? { ...draft, productId: null } : draft)),
    }));
    setProductSaving(false);
    addToast({ kind: 'success', title: 'Product deleted' });
  };

  const createDraft = async (form: DraftForm) => {
    setDraftSaving(true);
    await sleep(350);
    const draft: DraftPost = {
      id: uid('draft'),
      title: form.title.trim() || 'Untitled draft',
      objective: form.objective,
      platform: form.platform,
      contentMode: form.contentMode,
      caption: form.caption.trim(),
      hashtags: parseKeywords(form.hashtags),
      productId: form.productId || null,
      mediaIds: form.mediaIds,
      status: 'draft',
      scheduledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((current: AppState) => ({ ...current, drafts: [draft, ...current.drafts] }));
    setDraftSaving(false);
    addToast({ kind: 'success', title: 'Draft created' });
    return draft;
  };

  const updateDraft = async (id: string, form: DraftForm) => {
    setDraftSaving(true);
    await sleep(300);
    const updatedAt = new Date().toISOString();
    setState((current: AppState) => ({
      ...current,
      drafts: current.drafts.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              title: form.title.trim() || 'Untitled draft',
              objective: form.objective,
              platform: form.platform,
              contentMode: form.contentMode,
              caption: form.caption.trim(),
              hashtags: parseKeywords(form.hashtags),
              productId: form.productId || null,
              mediaIds: form.mediaIds,
              updatedAt,
            }
          : draft,
      ),
    }));
    setDraftSaving(false);
    addToast({ kind: 'success', title: 'Draft saved' });
  };

  const duplicateDraft = async (id: string) => {
    const source = state.drafts.find((draft) => draft.id === id);
    if (!source) {
      throw new Error('Draft not found.');
    }

    const copy: DraftPost = {
      ...source,
      id: uid('draft'),
      title: `${source.title} Copy`,
      status: 'draft',
      scheduledAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((current) => ({ ...current, drafts: [copy, ...current.drafts] }));
    addToast({ kind: 'success', title: 'Draft duplicated' });
  };

  const deleteDraft = async (id: string) => {
    setDraftSaving(true);
    await sleep(300);
    setState((current: AppState) => ({ ...current, drafts: current.drafts.filter((draft) => draft.id !== id) }));
    setDraftSaving(false);
    addToast({ kind: 'success', title: 'Draft deleted' });
  };

  const scheduleDraft = async (id: string, form: ScheduleForm) => {
    const scheduledAt = new Date(form.scheduledAt).toISOString();
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      throw new Error('Select a future date and time.');
    }

    setDraftSaving(true);
    await sleep(300);
    setState((current: AppState) => ({
      ...current,
      drafts: current.drafts.map((draft) =>
        draft.id === id
          ? { ...draft, status: 'scheduled', scheduledAt, updatedAt: new Date().toISOString() }
          : draft,
      ),
    }));
    setDraftSaving(false);
    addToast({ kind: 'success', title: 'Draft scheduled' });
  };

  const unscheduleDraft = async (id: string) => {
    setDraftSaving(true);
    await sleep(250);
    setState((current: AppState) => ({
      ...current,
      drafts: current.drafts.map((draft) =>
        draft.id === id
          ? { ...draft, status: 'draft', scheduledAt: null, updatedAt: new Date().toISOString() }
          : draft,
      ),
    }));
    setDraftSaving(false);
    addToast({ kind: 'success', title: 'Draft returned to draft status' });
  };

  const generateContent = async (form: AiForm) => {
    setAiGenerating(true);
    const result = await generateMockAi(state, form);
    const draft = form.productId ? state.drafts.find((entry) => entry.productId === form.productId) : undefined;
    const log: AiGenerationLog = {
      id: uid('ai'),
      promptSummary: buildAiPromptSummary(form, draft, state.products.find((entry) => entry.id === form.productId)?.name),
      outputPreview: result.outputPreview,
      createdAt: new Date().toISOString(),
    };

    setState((current: AppState) => ({ ...current, aiLogs: [log, ...current.aiLogs] }));
    setAiGenerating(false);
    addToast({ kind: 'success', title: 'Content generated' });
    return {
      mainCaption: result.mainCaption,
      alternatives: result.alternatives,
      hashtags: result.hashtags,
      imagePrompt: result.imagePrompt,
      imagePreviewUrl: result.imagePreviewUrl,
      palette: result.palette,
    };
  };

  const applyCaptionToDraft = async (draftId: string, caption: string, hashtags: string[]) => {
    const target = state.drafts.find((draft) => draft.id === draftId);
    if (!target) {
      throw new Error('Draft not found.');
    }

    await updateDraft(draftId, {
      ...draftToForm(target),
      caption,
      hashtags: hashtags.join(', '),
    });
  };

  const openDraftEditor = (draft: DraftPost | null) => {
    setDraftEditor({ draftId: draft?.id ?? null, form: draft ? draftToForm(draft) : defaultDraftForm() });
  };

  const updateDraftEditor = (form: Partial<DraftForm>) => {
    setDraftEditor((current: EditorState) => ({
      ...current,
      form: { ...current.form, ...form },
    }));
  };

  const resetDraftEditor = () => {
    setDraftEditor({ draftId: null, form: defaultDraftForm() });
  };

  const toggleAccountConnection = (platform: Platform) => {
    const account = state.accounts.find((entry) => entry.platform === platform);
    setState((current: AppState) => ({
      ...current,
      accounts: current.accounts.map((entry) =>
        entry.platform === platform
          ? { ...entry, connected: !entry.connected, handle: entry.connected ? entry.handle : entry.handle || `@${current.profile.businessName.toLowerCase().replace(/\s+/g, '')}` }
          : entry,
      ),
    }));

    if (account) {
      addToast({
        kind: account.connected ? 'info' : 'success',
        title: account.connected ? `${account.label} disconnected` : `${account.label} connected`,
        description: account.connected ? 'Connection removed from the demo workspace.' : 'Connection saved locally.',
      });
    }
  };

  const saveGeneratedMedia = async (name: string, url: string) => {
    const mediaAsset: MediaAsset = {
      id: createMediaId(),
      name,
      url,
      type: 'image',
      source: 'generated',
      createdAt: new Date().toISOString(),
    };

    setState((current: AppState) => ({
      ...current,
      media: [mediaAsset, ...current.media],
    }));
    addToast({ kind: 'success', title: 'Saved to media library', description: name });
    return mediaAsset;
  };

  const uploadMedia = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (list.length === 0) {
      throw new Error('Choose one or more image files.');
    }

    const created = await Promise.all(
      list.map(async (file) => {
        const url = await fileToDataUrl(file);
        const asset: MediaAsset = {
          id: createMediaId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          url,
          type: 'image',
          source: 'upload',
          createdAt: new Date().toISOString(),
        };
        return asset;
      }),
    );

    setState((current: AppState) => ({
      ...current,
      media: [...created, ...current.media],
    }));
    addToast({ kind: 'success', title: 'Media uploaded', description: `${created.length} image${created.length === 1 ? '' : 's'} added.` });
  };

  const deleteMedia = async (id: string) => {
    setState((current: AppState) => ({
      ...current,
      media: current.media.filter((asset) => asset.id !== id),
      drafts: current.drafts.map((draft) => ({
        ...draft,
        mediaIds: draft.mediaIds.filter((mediaId) => mediaId !== id),
      })),
    }));
    addToast({ kind: 'success', title: 'Media removed' });
  };

  const value = useMemo<AppContextValue>(
    () => ({
      session: state.session,
      profile: state.profile,
      products: state.products,
      drafts: state.drafts,
      aiLogs: state.aiLogs,
      media: state.media,
      accounts: state.accounts,
      toasts,
      isHydrated,
      loginState,
      profileSaving,
      productSaving,
      draftSaving,
      aiGenerating,
      login,
      logout,
      saveProfile,
      createProduct,
      updateProduct,
      deleteProduct,
      createDraft,
      updateDraft,
      duplicateDraft,
      deleteDraft,
      scheduleDraft,
      unscheduleDraft,
      generateContent,
      applyCaptionToDraft,
      openDraftEditor,
      draftEditor,
      updateDraftEditor,
      resetDraftEditor,
      toggleAccountConnection,
      uploadMedia,
      saveGeneratedMedia,
      deleteMedia,
      addToast,
      dismissToast,
    }),
    [state, toasts, isHydrated, loginState, profileSaving, productSaving, draftSaving, aiGenerating, draftEditor],
  );

  return <AppContext.Provider value={value}>{children as ReactNode}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}