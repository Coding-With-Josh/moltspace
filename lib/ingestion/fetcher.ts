import { moltbookClient } from '@/lib/moltbook/client';
import type {
  MoltbookPost,
  MoltbookComment,
  MoltbookAgent,
  MoltbookSubmolt,
} from '@/lib/moltbook/types';

export interface IngestionStats {
  postsFetched: number;
  commentsFetched: number;
  agentsFetched: number;
  submoltsFetched: number;
  errors: string[];
}

export interface FetchPostsResult {
  posts: MoltbookPost[];
  errors: string[];
}

/**
 * Fetch all posts from Moltbook with pagination
 */
export async function fetchAllPosts(
  onProgress?: (stats: IngestionStats) => void,
  maxPosts?: number
): Promise<FetchPostsResult> {
  const allPosts: MoltbookPost[] = [];
  const errors: string[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  const stats: IngestionStats = {
    postsFetched: 0,
    commentsFetched: 0,
    agentsFetched: 0,
    submoltsFetched: 0,
    errors: [],
  };

  while (hasMore && (!maxPosts || allPosts.length < maxPosts)) {
    try {
      const response = await moltbookClient.getPosts({
        limit,
        offset,
        sort: 'new',
      });

      const batch = Array.isArray(response.posts) ? response.posts : [];
      allPosts.push(...batch);
      stats.postsFetched = allPosts.length;
      hasMore = batch.length === limit && (response.has_more ?? false) && (!maxPosts || allPosts.length < maxPosts);
      offset = response.next_offset ?? offset + limit;

      if (onProgress) {
        onProgress(stats);
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to fetch posts at offset ${offset}: ${errorMsg}`);
      hasMore = false; // Stop on error
    }
  }

  return { posts: allPosts, errors };
}

/**
 * Fetch comments for a post (recursively fetches replies)
 */
export async function fetchPostComments(
  postId: string,
  onProgress?: (count: number) => void
): Promise<MoltbookComment[]> {
  const allComments: MoltbookComment[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const response = await moltbookClient.getComments(postId, {
        limit,
        offset,
      });

      allComments.push(...response.comments);
      offset += response.comments.length;

      if (onProgress) {
        onProgress(allComments.length);
      }

      // If we got fewer comments than requested, we're done
      if (response.comments.length < limit) {
        break;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to fetch comments for post ${postId}:`, error);
      break;
    }
  }

  return allComments;
}

/**
 * Fetch a single batch of recent agents (API has no offset, so we only fetch once).
 * Missing post authors are created on-the-fly in processPosts via ensureAgent().
 */
export async function fetchAllAgents(): Promise<MoltbookAgent[]> {
  try {
    const response = await moltbookClient.getAgents({
      limit: 100,
      sort: 'recent',
    });
    return response.agents ?? [];
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return [];
  }
}

/**
 * Fetch all submolts
 */
export async function fetchAllSubmolts(): Promise<MoltbookSubmolt[]> {
  try {
    const response = await moltbookClient.getSubmolts();
    return response.submolts;
  } catch (error) {
    console.error('Failed to fetch submolts:', error);
    return [];
  }
}
