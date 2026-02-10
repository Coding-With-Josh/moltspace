import { db } from '@/lib/db/client';
import { agents, submolts, posts, comments } from '@/lib/db/schema';
import type {
  MoltbookPost,
  MoltbookComment,
  MoltbookAgent,
  MoltbookSubmolt,
} from '@/lib/moltbook/types';
import { eq } from 'drizzle-orm';

/**
 * Process and store agents in database
 */
export async function processAgents(moltbookAgents: MoltbookAgent[]): Promise<Map<string, string>> {
  const agentIdMap = new Map<string, string>(); // moltbookId -> dbId

  for (const agent of moltbookAgents) {
    try {
      const [existing] = await db
        .select()
        .from(agents)
        .where(eq(agents.moltbookId, agent.id))
        .limit(1);

      if (existing) {
        // Update existing agent
        await db
          .update(agents)
          .set({
            name: agent.name,
            description: agent.description || null,
            karma: agent.karma,
            followerCount: agent.follower_count,
            createdAt: new Date(agent.created_at),
            lastSeenAt: new Date(),
          })
          .where(eq(agents.id, existing.id));

        agentIdMap.set(agent.id, existing.id);
      } else {
        // Insert new agent
        const [newAgent] = await db
          .insert(agents)
          .values({
            moltbookId: agent.id,
            name: agent.name,
            description: agent.description || null,
            karma: agent.karma,
            followerCount: agent.follower_count,
            createdAt: new Date(agent.created_at),
            lastSeenAt: new Date(),
          })
          .returning();

        agentIdMap.set(agent.id, newAgent.id);
      }
    } catch (error) {
      console.error(`Failed to process agent ${agent.id}:`, error);
    }
  }

  return agentIdMap;
}

/**
 * Ensure an agent exists in DB (upsert from post author info). Returns db id.
 * Uses ON CONFLICT to avoid duplicate key errors when the same author appears in multiple posts.
 */
export async function ensureAgent(moltbookId: string, name: string): Promise<string> {
  const [row] = await db
    .insert(agents)
    .values({
      moltbookId,
      name,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: agents.moltbookId,
      set: { name, lastSeenAt: new Date() },
    })
    .returning();
  return row!.id;
}

/**
 * Process and store submolts in database
 */
export async function processSubmolts(
  moltbookSubmolts: MoltbookSubmolt[]
): Promise<Map<string, string>> {
  const submoltIdMap = new Map<string, string>(); // moltbookId -> dbId

  for (const submolt of moltbookSubmolts) {
    try {
      const [existing] = await db
        .select()
        .from(submolts)
        .where(eq(submolts.moltbookId, submolt.id))
        .limit(1);

      if (existing) {
        // Update existing submolt
        await db
          .update(submolts)
          .set({
            name: submolt.name,
            displayName: submolt.display_name,
            description: submolt.description || null,
            subscriberCount: submolt.subscriber_count,
            createdAt: new Date(submolt.created_at),
            lastActivityAt: submolt.last_activity_at ? new Date(submolt.last_activity_at) : null,
          })
          .where(eq(submolts.id, existing.id));

        submoltIdMap.set(submolt.id, existing.id);
      } else {
        // Insert new submolt
        const [newSubmolt] = await db
          .insert(submolts)
          .values({
            moltbookId: submolt.id,
            name: submolt.name,
            displayName: submolt.display_name,
            description: submolt.description || null,
            subscriberCount: submolt.subscriber_count,
            createdAt: new Date(submolt.created_at),
            lastActivityAt: submolt.last_activity_at ? new Date(submolt.last_activity_at) : null,
          })
          .returning();

        submoltIdMap.set(submolt.id, newSubmolt.id);
      }
    } catch (error) {
      console.error(`Failed to process submolt ${submolt.id}:`, error);
    }
  }

  return submoltIdMap;
}

/**
 * Process and store posts in database
 */
export async function processPosts(
  moltbookPosts: MoltbookPost[],
  agentIdMap: Map<string, string>,
  submoltIdMap: Map<string, string>
): Promise<Map<string, string>> {
  const postIdMap = new Map<string, string>(); // moltbookId -> dbId

  for (const post of moltbookPosts) {
    try {
      let authorId = agentIdMap.get(post.author.id);
      if (!authorId) {
        authorId = await ensureAgent(post.author.id, post.author.name);
        agentIdMap.set(post.author.id, authorId);
      }
      const submoltId = submoltIdMap.get(post.submolt.id);

      const [existing] = await db
        .select()
        .from(posts)
        .where(eq(posts.moltbookId, post.id))
        .limit(1);

      if (existing) {
        // Update existing post
        await db
          .update(posts)
          .set({
            title: post.title,
            content: post.content,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            commentCount: post.comment_count,
            createdAt: new Date(post.created_at),
          })
          .where(eq(posts.id, existing.id));

        postIdMap.set(post.id, existing.id);
      } else {
        // Insert new post
        const [newPost] = await db
          .insert(posts)
          .values({
            moltbookId: post.id,
            title: post.title,
            content: post.content,
            authorId: authorId,
            submoltId: submoltId || null,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            commentCount: post.comment_count,
            createdAt: new Date(post.created_at),
          })
          .returning();

        postIdMap.set(post.id, newPost.id);
      }
    } catch (error) {
      console.error(`Failed to process post ${post.id}:`, error);
    }
  }

  return postIdMap;
}

/**
 * Process and store comments in database (recursively handles replies)
 */
export async function processComments(
  moltbookComments: MoltbookComment[],
  postId: string,
  agentIdMap: Map<string, string>,
  parentId?: string
): Promise<number> {
  let count = 0;

  for (const comment of moltbookComments) {
    try {
      const authorId = agentIdMap.get(comment.author.id);

      if (!authorId) {
        console.warn(`Skipping comment ${comment.id}: author not found`);
        continue;
      }

      const [existing] = await db
        .select()
        .from(comments)
        .where(eq(comments.moltbookId, comment.id))
        .limit(1);

      if (existing) {
        // Update existing comment
        await db
          .update(comments)
          .set({
            content: comment.content,
            upvotes: comment.upvotes,
            downvotes: comment.downvotes,
            createdAt: new Date(comment.created_at),
          })
          .where(eq(comments.id, existing.id));

        // Process replies
        if (comment.replies && comment.replies.length > 0) {
          count += await processComments(comment.replies, postId, agentIdMap, existing.id);
        }
      } else {
        // Insert new comment
        const [newComment] = await db
          .insert(comments)
          .values({
            moltbookId: comment.id,
            postId: postId,
            parentId: parentId || null,
            content: comment.content,
            authorId: authorId,
            upvotes: comment.upvotes,
            downvotes: comment.downvotes,
            createdAt: new Date(comment.created_at),
          })
          .returning();

        count++;

        // Process replies
        if (comment.replies && comment.replies.length > 0) {
          count += await processComments(comment.replies, postId, agentIdMap, newComment.id);
        }
      }
    } catch (error) {
      console.error(`Failed to process comment ${comment.id}:`, error);
    }
  }

  return count;
}
