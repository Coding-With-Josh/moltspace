import {
  MoltbookPost,
  MoltbookPostsResponse,
  MoltbookComment,
  MoltbookCommentsResponse,
  MoltbookAgent,
  MoltbookAgentsResponse,
  MoltbookSubmolt,
  MoltbookSubmoltsResponse,
} from './types';

const BASE_URL = process.env.MOLTBOOK_BASE_URL || 'https://www.moltbook.com';
const RATE_LIMIT_DELAY = parseInt(process.env.MOLTBOOK_RATE_LIMIT_DELAY_MS || '1000', 10);

let lastRequestTime = 0;

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MoltSpace/1.0 (ingestion; +https://github.com/moltspace)',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

export class MoltbookClient {
  /**
   * Fetch posts with pagination
   */
  async getPosts(params: {
    limit?: number;
    offset?: number;
    sort?: 'new' | 'top' | 'discussed';
  } = {}): Promise<MoltbookPostsResponse> {
    const { limit = 100, offset = 0, sort = 'new' } = params;
    const url = new URL(`${BASE_URL}/api/v1/posts`);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('offset', offset.toString());
    if (sort) {
      url.searchParams.set('sort', sort);
    }
    
    const response = await rateLimitedFetch(url.toString());
    return response.json();
  }
  
  /**
   * Fetch a single post by ID
   */
  async getPost(postId: string): Promise<MoltbookPost> {
    const url = `${BASE_URL}/api/v1/posts/${postId}`;
    const response = await rateLimitedFetch(url.toString());
    const data = await response.json();
    return data.post || data;
  }
  
  /**
   * Fetch comments for a post
   */
  async getComments(postId: string, params: {
    limit?: number;
    offset?: number;
  } = {}): Promise<MoltbookCommentsResponse> {
    const { limit = 100, offset = 0 } = params;
    const url = new URL(`${BASE_URL}/api/v1/posts/${postId}/comments`);
    url.searchParams.set('limit', limit.toString());
    if (offset > 0) {
      url.searchParams.set('offset', offset.toString());
    }
    
    const response = await rateLimitedFetch(url.toString());
    return response.json();
  }
  
  /**
   * Fetch recent agents
   */
  async getAgents(params: {
    limit?: number;
    sort?: 'recent' | 'karma' | 'followers';
  } = {}): Promise<MoltbookAgentsResponse> {
    const { limit = 50, sort = 'recent' } = params;
    const url = new URL(`${BASE_URL}/api/v1/agents/recent`);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('sort', sort);
    
    const response = await rateLimitedFetch(url.toString());
    return response.json();
  }
  
  /**
   * Fetch all submolts
   */
  async getSubmolts(): Promise<MoltbookSubmoltsResponse> {
    const url = `${BASE_URL}/api/v1/submolts`;
    const response = await rateLimitedFetch(url.toString());
    return response.json();
  }
  
  /**
   * Build Moltbook URL for a post
   */
  getPostUrl(postId: string): string {
    return `${BASE_URL}/post/${postId}`;
  }
  
  /**
   * Build Moltbook URL for an agent
   */
  getAgentUrl(agentName: string): string {
    return `${BASE_URL}/u/${agentName}`;
  }
  
  /**
   * Build Moltbook URL for a submolt
   */
  getSubmoltUrl(submoltName: string): string {
    return `${BASE_URL}/m/${submoltName}`;
  }
}

export const moltbookClient = new MoltbookClient();
