// =====================
// ZWROTNY.pl - TypeScript Types
// =====================

// Content types for the CMS (using Supabase)

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category: PostCategory;
  tags?: string[];
  author?: Author;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  readingTime?: number;
  featured?: boolean;
  sources?: Source[];
  seo?: SEOMeta;
  status: 'draft' | 'published' | 'archived';
  aiGenerated?: boolean;
  source?: string;
}

export interface Author {
  id?: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Source {
  title: string;
  url: string;
  publisher?: string;
}

export interface SEOMeta {
  title: string;
  description: string;
  ogImage: string;
  keywords: string[];
}

export type PostCategory = 
  | 'aktualnosci'
  | 'poradniki'
  | 'prawo'
  | 'ekologia'
  | 'biznes'
  | 'technologia';

export interface AINewsCandidate {
  id: string;
  originalTitle: string;
  originalUrl: string;
  originalSource: string;
  originalContent?: string;
  summary: string;
  relevanceScore: number;
  suggestedCategory: PostCategory;
  suggestedTags?: string[];
  fetchedAt: string;
  status: 'pending' | 'ai_processing' | 'ai_done' | 'manual' | 'rejected' | 'published';
  aiGeneratedPost?: Partial<Post>;
  processedAt?: string;
  rejectedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  type: 'ai_article' | 'fetch_news' | 'generate_image' | 'seo_optimization';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SiteSettings {
  id: string;
  siteName: string;
  tagline: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  header: {
    showTagline: boolean;
    ctaText: string;
    ctaUrl: string;
    menuItems: MenuItem[];
  };
  footer: {
    copyright: string;
    links: FooterLink[];
    socialLinks: SocialLink[];
  };
  sections: {
    hero: SectionConfig;
    articles: SectionConfig;
    youtube: SectionConfig;
    guides: SectionConfig;
    myths: SectionConfig;
    newsletter: SectionConfig;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultOgImage: string;
    analyticsId?: string;
  };
  ads: AdConfig;
  aiPrompts: AIPromptConfig;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  order: number;
  children?: MenuItem[];
}

export interface FooterLink {
  label: string;
  href: string;
  category: string;
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'youtube' | 'instagram' | 'linkedin';
  url: string;
}

export interface SectionConfig {
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
}

export interface Ad {
  id: string;
  title: string;
  client: string;
  imageUrl: string;
  targetUrl: string;
  position: 'hero-banner' | 'sidebar' | 'in-content' | 'footer';
  format: 'banner' | 'square' | 'skyscraper' | 'native';
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface AdConfig {
  enabled: boolean;
  placements: {
    topBanner: AdPlacement;
    sidebar: AdPlacement;
    inFeed: AdPlacement;
    inArticle: AdPlacement;
    footer: AdPlacement;
  };
}

export interface AdPlacement {
  enabled: boolean;
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
  size: 'small' | 'medium' | 'large' | 'responsive';
}

export interface AIPromptConfig {
  globalSystemPrompt: string;
  articlePrompt: string;
  summaryPrompt: string;
  seoPrompt: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  steps?: GuideStep[];
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number;
  status?: 'draft' | 'published';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuideStep {
  order?: number;
  title: string;
  content?: string;
  description?: string;
  image?: string;
}

export interface MythFact {
  id: string;
  myth: string;
  fact: string;
  explanation?: string;
  source?: string;
  order?: number;
  category?: string;
  status?: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
  }

export interface YouTubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  category?: string;
  order?: number;
  status?: 'draft' | 'published';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  position?: 'sidebar' | 'header' | 'footer' | 'inline';
  startDate?: string;
  endDate?: string;
  clicks?: number;
  impressions?: number;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  pendingNews: number;
  aiProcessing: number;
  totalViews: number;
  todayViews: number;
  totalGuides?: number;
  totalMyths?: number;
  totalVideos?: number;
}

// API Response types for future backend integration
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types for CMS
export interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: PostCategory;
  tags: string[];
  sources: Source[];
  status: 'draft' | 'published';
  seo: SEOMeta;
}

export interface NewsProcessAction {
  action: 'ai' | 'manual' | 'reject';
  newsId: string;
  rejectedReason?: string;
}
