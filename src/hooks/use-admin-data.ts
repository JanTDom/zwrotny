'use client'

import useSWR from 'swr'
import type { 
  Post, 
  Guide, 
  MythFact, 
  YouTubeVideo, 
  Banner, 
  AINewsCandidate,
  DashboardStats,
  APIResponse,
  Job 
} from '@/types'

// Simple fetcher for local Supabase API
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error('An error occurred while fetching the data.')
  }

  return response.json()
}

// ============================================
// POSTS - Supabase
// ============================================

export function useAdminPosts(params?: { status?: string; category?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.category) searchParams.set('category', params.category)
  const query = searchParams.toString()
  
  const { data, error, isLoading, mutate } = useSWR<APIResponse<Post[]>>(
    `/api/posts${query ? `?${query}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    posts: data?.data || [],
    isLoading,
    error,
    mutate,
  }
}

export function useAdminPost(id: string) {
  const { data, error, isLoading, mutate } = useSWR<APIResponse<Post>>(
    id ? `/api/posts/${id}` : null,
    fetcher
  )

  return {
    post: data?.data,
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// GUIDES - Supabase
// ============================================

export function useAdminGuides(params?: { status?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  const query = searchParams.toString()

  const { data, error, isLoading, mutate } = useSWR<APIResponse<Guide[]>>(
    `/api/guides${query ? `?${query}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    guides: data?.data || [],
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// MYTHS - Supabase
// ============================================

export function useAdminMyths(params?: { status?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  const query = searchParams.toString()

  const { data, error, isLoading, mutate } = useSWR<APIResponse<MythFact[]>>(
    `/api/myths${query ? `?${query}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    myths: data?.data || [],
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// VIDEOS - Supabase
// ============================================

export function useAdminVideos(params?: { status?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  const query = searchParams.toString()

  const { data, error, isLoading, mutate } = useSWR<APIResponse<YouTubeVideo[]>>(
    `/api/videos${query ? `?${query}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    videos: data?.data || [],
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// BANNERS - Supabase
// ============================================

export function useAdminBanners(params?: { active?: boolean; position?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.active !== undefined) searchParams.set('active', String(params.active))
  if (params?.position) searchParams.set('position', params.position)
  const query = searchParams.toString()

  const { data, error, isLoading, mutate } = useSWR<APIResponse<Banner[]>>(
    `/api/banners${query ? `?${query}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    banners: data?.data || [],
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// Dashboard stats - computed from Supabase data
// ============================================

export function useDashboardStats() {
  const { posts } = useAdminPosts()
  const { guides } = useAdminGuides()
  const { myths } = useAdminMyths()
  const { videos } = useAdminVideos()
  const { candidates } = useAICandidates()

  // Real visitor analytics (last 30 days)
  const { data: analytics } = useSWR<{ totalViews: number; todayViews: number }>(
    '/api/analytics/stats?range=30d',
    fetcher,
    { revalidateOnFocus: false }
  )

  const stats: DashboardStats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.status === 'published').length,
    draftPosts: posts.filter(p => p.status === 'draft').length,
    pendingNews: candidates.filter(c => c.status === 'pending').length,
    aiProcessing: candidates.filter(c => c.status === 'ai_processing').length,
    totalViews: analytics?.totalViews ?? 0,
    todayViews: analytics?.todayViews ?? 0,
    totalGuides: guides.length,
    totalMyths: myths.length,
    totalVideos: videos.length,
  }

  return {
    stats,
    isLoading: false,
    error: null,
    mutate: () => {},
  }
}

// ============================================
// AI Candidates - Local storage (for now)
// ============================================

const AI_CANDIDATES_KEY = 'zwrotny_ai_candidates'

function getLocalCandidates(): AINewsCandidate[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(AI_CANDIDATES_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveLocalCandidates(candidates: AINewsCandidate[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AI_CANDIDATES_KEY, JSON.stringify(candidates))
}

export function useAICandidates(status?: string) {
  const { data, error, isLoading, mutate } = useSWR<AINewsCandidate[]>(
    'local-ai-candidates',
    () => {
      const all = getLocalCandidates()
      return status ? all.filter(c => c.status === status) : all
    },
    { revalidateOnFocus: false }
  )

  return {
    candidates: data || [],
    isLoading,
    error,
    mutate,
  }
}

// ============================================
// API helpers - all Supabase
// ============================================

async function apiCall<T>(
  endpoint: string,
  options: RequestInit
): Promise<APIResponse<T>> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error')
    throw new Error(`API Error: ${errorBody}`)
  }

  if (response.status === 204) {
    return { data: undefined as T, success: true }
  }

  const json = await response.json()
  return { ...json, success: true }
}

// CRUD helpers - all using Supabase API
export const adminApi = {
  // Posts
  createPost: (data: Partial<Post>) => 
    apiCall<Post>('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
  
  updatePost: (id: string, data: Partial<Post>) => 
    apiCall<Post>(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deletePost: (id: string) => 
    apiCall<void>(`/api/posts/${id}`, { method: 'DELETE' }),

  // Guides
  createGuide: (data: Partial<Guide>) => 
    apiCall<Guide>('/api/guides', { method: 'POST', body: JSON.stringify(data) }),
  
  updateGuide: (id: string, data: Partial<Guide>) => 
    apiCall<Guide>(`/api/guides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteGuide: (id: string) => 
    apiCall<void>(`/api/guides/${id}`, { method: 'DELETE' }),

  // Myths
  createMyth: (data: Partial<MythFact>) => 
    apiCall<MythFact>('/api/myths', { method: 'POST', body: JSON.stringify(data) }),
  
  updateMyth: (id: string, data: Partial<MythFact>) => 
    apiCall<MythFact>(`/api/myths/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteMyth: (id: string) => 
    apiCall<void>(`/api/myths/${id}`, { method: 'DELETE' }),

  // Videos
  createVideo: (data: Partial<YouTubeVideo>) => 
    apiCall<YouTubeVideo>('/api/videos', { method: 'POST', body: JSON.stringify(data) }),
  
  updateVideo: (id: string, data: Partial<YouTubeVideo>) => 
    apiCall<YouTubeVideo>(`/api/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteVideo: (id: string) => 
    apiCall<void>(`/api/videos/${id}`, { method: 'DELETE' }),

  // Banners
  createBanner: (data: Partial<Banner>) => 
    apiCall<Banner>('/api/banners', { method: 'POST', body: JSON.stringify(data) }),
  
  updateBanner: (id: string, data: Partial<Banner>) => 
    apiCall<Banner>(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteBanner: (id: string) => 
    apiCall<void>(`/api/banners/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => 
    apiCall<Record<string, unknown>>('/api/settings', { method: 'GET' }),
  
  updateSettings: (data: Record<string, unknown>) => 
    apiCall<void>('/api/settings', { method: 'POST', body: JSON.stringify(data) }),

  // AI Candidates - Local storage
  createCandidate: async (data: Partial<AINewsCandidate>): Promise<APIResponse<AINewsCandidate>> => {
    const candidates = getLocalCandidates()
    const newCandidate: AINewsCandidate = {
      id: crypto.randomUUID(),
      originalTitle: data.originalTitle || '',
      originalContent: data.originalContent || '',
      originalUrl: data.originalUrl || '',
      originalSource: data.originalSource || '',
      summary: data.summary || '',
      relevanceScore: data.relevanceScore || 0,
      suggestedCategory: data.suggestedCategory || 'aktualnosci',
      fetchedAt: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...data,
    } as AINewsCandidate
    candidates.unshift(newCandidate)
    saveLocalCandidates(candidates)
    return { data: newCandidate, success: true }
  },
  
  updateCandidate: async (id: string, data: Partial<AINewsCandidate>): Promise<APIResponse<AINewsCandidate>> => {
    const candidates = getLocalCandidates()
    const index = candidates.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Candidate not found')
    candidates[index] = { ...candidates[index], ...data }
    saveLocalCandidates(candidates)
    return { data: candidates[index], success: true }
  },
  
  deleteCandidate: async (id: string): Promise<APIResponse<void>> => {
    const candidates = getLocalCandidates().filter(c => c.id !== id)
    saveLocalCandidates(candidates)
    return { data: undefined, success: true }
  },
  
  processCandidate: async (id: string, action: 'ai' | 'manual'): Promise<APIResponse<AINewsCandidate>> => {
    const candidates = getLocalCandidates()
    const index = candidates.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Candidate not found')
    candidates[index].status = action === 'ai' ? 'ai_processing' : 'manual'
    saveLocalCandidates(candidates)
    return { data: candidates[index], success: true }
  },
  
  rejectCandidate: async (id: string, reason?: string): Promise<APIResponse<AINewsCandidate>> => {
    const candidates = getLocalCandidates()
    const index = candidates.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Candidate not found')
    candidates[index].status = 'rejected'
    candidates[index].rejectedReason = reason
    saveLocalCandidates(candidates)
    return { data: candidates[index], success: true }
  },

  // Jobs - placeholder (could be implemented with Supabase functions later)
  triggerJob: async (type: string) => {
    console.log('Job trigger requested:', type)
    return { data: undefined, success: true }
  },
}

// ============================================
// JOBS - Placeholder for background tasks
// ============================================

export function useJobs() {
  // Jobs are placeholder - no actual backend yet
  // In the future, this could use Supabase functions or a queue system
  
  return {
    jobs: [] as Job[],
    isLoading: false,
    error: null,
    mutate: () => Promise.resolve(),
  }
}
