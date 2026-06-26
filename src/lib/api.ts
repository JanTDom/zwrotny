// API Client for ZWROTNY.pl
// All content from Supabase - uses service_role key to bypass RLS for SSR

import { createServiceClient } from '@/lib/supabase/service'
import type { 
  Post, 
  Guide, 
  MythFact, 
  YouTubeVideo, 
  Banner, 
  SiteSettings,
  APIResponse
} from '@/types';

// =====================
// POSTS
// =====================

export async function getPosts(params?: { 
  status?: string; 
  category?: string; 
  featured?: boolean;
  limit?: number;
  page?: number;
}): Promise<APIResponse<Post[]>> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    
    if (params?.category) {
      query = query.eq('category', params.category);
    }
    
    if (params?.featured !== undefined) {
      query = query.eq('featured', params.featured);
    }
    
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase getPosts error:', error);
      return { data: [], success: false };
    }
    
    const posts: Post[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      coverImage: row.cover_image,
      category: row.category,
      status: row.status,
      author: { name: row.author_name },
      tags: row.tags || [],
      readingTime: row.reading_time,
      featured: row.featured,
      source: row.source,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { data: posts, success: true };
  } catch (error) {
    console.error('getPosts error:', error);
    return { data: [], success: false };
  }
}

export async function getPostBySlug(slug: string): Promise<APIResponse<Post | null>> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, success: true };
      }
      console.error('Supabase getPostBySlug error:', error);
      return { data: null, success: false };
    }
    
    const post: Post = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.cover_image,
      category: data.category,
      status: data.status,
      author: { name: data.author_name },
      tags: data.tags || [],
      readingTime: data.reading_time,
      featured: data.featured,
      source: data.source,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return { data: post, success: true };
  } catch (error) {
    console.error('getPostBySlug error:', error);
    return { data: null, success: false };
  }
}

export async function getPostById(id: string): Promise<APIResponse<Post | null>> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, success: true };
      }
      console.error('Supabase getPostById error:', error);
      return { data: null, success: false };
    }
    
    const post: Post = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.cover_image,
      category: data.category,
      status: data.status,
      author: { name: data.author_name },
      tags: data.tags || [],
      readingTime: data.reading_time,
      featured: data.featured,
      source: data.source,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return { data: post, success: true };
  } catch (error) {
    console.error('getPostById error:', error);
    return { data: null, success: false };
  }
}

// =====================
// GUIDES
// =====================

export async function getGuides(params?: { status?: string }): Promise<APIResponse<Guide[]>> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Default to published for public pages
    const status = params?.status ?? 'published';
    query = query.eq('status', status);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase getGuides error:', error);
      return { data: [], success: false };
    }
    
    const guides: Guide[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      difficulty: row.difficulty,
      estimatedTime: row.estimated_time,
      category: row.category,
      steps: row.steps || [],
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { data: guides, success: true };
  } catch (error) {
    console.error('getGuides error:', error);
    return { data: [], success: false };
  }
}

export async function getGuideBySlug(slug: string): Promise<APIResponse<Guide | null>> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, success: true };
      }
      console.error('Supabase getGuideBySlug error:', error);
      return { data: null, success: false };
    }
    
    const guide: Guide = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      difficulty: data.difficulty,
      estimatedTime: data.estimated_time,
      category: data.category,
      steps: data.steps || [],
      status: data.status,
      publishedAt: data.published_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return { data: guide, success: true };
  } catch (error) {
    console.error('getGuideBySlug error:', error);
    return { data: null, success: false };
  }
}

// =====================
// MYTHS/FACTS
// =====================

export async function getMythsFacts(params?: { status?: string }): Promise<APIResponse<MythFact[]>> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('myths')
      .select('*')
      .order('order', { ascending: true });
    
    // Default to published if no status specified (for public pages)
    const status = params?.status ?? 'published';
    query = query.eq('status', status);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase getMythsFacts error:', error);
      return { data: [], success: false };
    }
    
    const myths: MythFact[] = (data || []).map(row => ({
      id: row.id,
      myth: row.myth,
      fact: row.fact,
      explanation: row.explanation,
      source: row.source,
      category: row.category,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { data: myths, success: true };
  } catch (error) {
    console.error('getMythsFacts error:', error);
    return { data: [], success: false };
  }
}

// =====================
// YOUTUBE VIDEOS
// =====================

export async function getYouTubeVideos(params?: { status?: string; featured?: boolean }): Promise<APIResponse<YouTubeVideo[]>> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('videos')
      .select('*')
      .order('order', { ascending: true });
    
    // Default to published for public pages
    const status = params?.status ?? 'published';
    query = query.eq('status', status);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase getYouTubeVideos error:', error);
      return { data: [], success: false };
    }
    
    const videos: YouTubeVideo[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      youtubeId: row.youtube_id,
      description: row.description,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      order: row.order,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { data: videos, success: true };
  } catch (error) {
    console.error('getYouTubeVideos error:', error);
    return { data: [], success: false };
  }
}

// =====================
// BANNERS
// =====================

export async function getBanners(placement?: string): Promise<APIResponse<Banner[]>> {
  try {
    const supabase = createServiceClient();
    
    let query = supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });
    
    if (placement) {
      query = query.eq('position', placement);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase getBanners error:', error);
      return { data: [], success: false };
    }
    
    const banners: Banner[] = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      linkUrl: row.link_url,
      position: row.position,
      startDate: row.start_date,
      endDate: row.end_date,
      clicks: row.clicks,
      impressions: row.impressions,
      isActive: row.is_active,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { data: banners, success: true };
  } catch (error) {
    console.error('getBanners error:', error);
    return { data: [], success: false };
  }
}

// =====================
// BONUSES
// =====================

export interface Bonus {
  id: string
  title: string
  pdf_url: string
  pdf_pathname: string
  thumbnail_url?: string | null
  is_active: boolean
  order: number
  created_at: string
}

export async function getBonuses(): Promise<APIResponse<Bonus[]>> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('bonuses')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase getBonuses error:', error)
      return { data: [], success: false }
    }
    return { data: data || [], success: true }
  } catch (error) {
    console.error('getBonuses error:', error)
    return { data: [], success: false }
  }
}

// =====================
// FILMY (MP4)
// =====================

export interface Film {
  id: string
  title: string
  video_url: string
  video_pathname: string
  is_active: boolean
  order: number
  created_at: string
}

export async function getFilmy(): Promise<APIResponse<Film[]>> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('filmy')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase getFilmy error:', error)
      return { data: [], success: false }
    }
    return { data: data || [], success: true }
  } catch (error) {
    console.error('getFilmy error:', error)
    return { data: [], success: false }
  }
}

// =====================
// SETTINGS
// =====================

export async function getSiteSettings(): Promise<APIResponse<Record<string, unknown> | null>> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    
    if (error) {
      console.error('Supabase getSiteSettings error:', error);
      return { data: null, success: false };
    }
    
    // Convert array to object
    const settings: Record<string, unknown> = {};
    for (const item of data || []) {
      settings[item.key] = item.value;
    }
    
    return { data: settings, success: true };
  } catch (error) {
    console.error('getSiteSettings error:', error);
    return { data: null, success: false };
  }
}

// =====================
// MEDIA SECTION
// =====================

interface MediaSectionData {
  type: 'image' | 'video' | 'youtube'
  title?: string
  description?: string
  mediaUrl?: string
  linkUrl?: string
  linkText?: string
  youtubeId?: string
  isActive?: boolean
}

export async function getMediaSection(): Promise<APIResponse<MediaSectionData | null>> {
  try {
    const supabase = createServiceClient();
    
    // Use maybeSingle to avoid error when record doesn't exist
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'settings')
      .maybeSingle();
    
    if (error) {
      console.error('Supabase getMediaSection error:', error);
      return { data: null, success: true }; // Return null gracefully
    }
    
    if (!data) {
      return { data: null, success: true }; // No settings yet
    }
    
    const settings = data.value as { mediaSection?: MediaSectionData } | null;
    
    return { data: settings?.mediaSection || null, success: true };
  } catch (error) {
    console.error('getMediaSection error:', error);
    return { data: null, success: true };
  }
}
