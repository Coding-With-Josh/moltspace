import { NextResponse } from 'next/server';
import { fetchAllPosts, fetchAllAgents, fetchAllSubmolts, fetchPostComments } from '@/lib/ingestion/fetcher';
import { processAgents, processSubmolts, processPosts, processComments } from '@/lib/ingestion/processor';
import { generateEmbedding, embeddingToJson, canGenerateEmbeddings } from '@/lib/signals/embeddings';
import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // 5 minutes for Vercel

export async function POST(request: Request) {
  try {
    // Parse body if present, otherwise use defaults
    type IngestBody = { maxPosts?: number; includeComments?: boolean };
    let body: IngestBody = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text) as IngestBody;
      }
    } catch (e) {
      // Body is optional, use defaults
    }
    const { maxPosts = 100, includeComments = false } = body;

    const stats = {
      agentsProcessed: 0,
      submoltsProcessed: 0,
      postsProcessed: 0,
      commentsProcessed: 0,
      embeddingsGenerated: 0,
      errors: [] as string[],
    };

    // Step 1: Fetch and process agents
    console.log('Fetching agents...');
    const moltbookAgents = await fetchAllAgents();
    const agentIdMap = await processAgents(moltbookAgents);
    stats.agentsProcessed = agentIdMap.size;
    console.log(`Processed ${stats.agentsProcessed} agents`);

    // Step 2: Fetch and process submolts
    console.log('Fetching submolts...');
    const moltbookSubmolts = await fetchAllSubmolts();
    const submoltIdMap = await processSubmolts(moltbookSubmolts);
    stats.submoltsProcessed = submoltIdMap.size;
    console.log(`Processed ${stats.submoltsProcessed} submolts`);

    // Step 3: Fetch and process posts
    console.log('Fetching posts...');
    const { posts: moltbookPosts, errors: fetchErrors } = await fetchAllPosts(undefined, maxPosts);
    stats.errors.push(...fetchErrors);
    console.log(`Moltbook API returned ${moltbookPosts.length} posts`);
    if (moltbookPosts.length === 0 && fetchErrors.length === 0) {
      stats.errors.push('Moltbook API returned 0 posts. Check network or try increasing maxPosts.');
    }
    let postIdMap: Map<string, string>;
    try {
      postIdMap = await processPosts(moltbookPosts, agentIdMap, submoltIdMap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`processPosts failed: ${msg}`);
      console.error('processPosts error:', err);
      postIdMap = new Map();
    }
    stats.postsProcessed = postIdMap.size;
    console.log(`Processed ${stats.postsProcessed} posts (${moltbookPosts.length} fetched from API)`);

    // Step 4: Generate embeddings for posts (optional - skip if no GROQ_API_KEY)
    if (canGenerateEmbeddings()) {
      console.log('Generating embeddings...');
      for (const post of moltbookPosts.slice(0, Math.min(50, moltbookPosts.length))) {
        try {
          const dbPostId = postIdMap.get(post.id);
          if (!dbPostId) continue;

          const text = `${post.title}\n\n${post.content}`;
          const embedding = await generateEmbedding(text);
          const embeddingJson = embeddingToJson(embedding);

          await db
            .update(posts)
            .set({ embedding: embeddingJson })
            .where(eq(posts.id, dbPostId));

          stats.embeddingsGenerated++;
        } catch (error) {
          stats.errors.push(`Embedding failed for post ${post.id}: ${error}`);
        }
      }
    } else {
      stats.errors.push('GROQ_API_KEY not set; embeddings skipped. Posts still saved.');
    }

    // Step 5: Fetch and process comments (if requested)
    if (includeComments) {
      console.log('Fetching comments...');
      for (const post of moltbookPosts.slice(0, Math.min(10, moltbookPosts.length))) {
        try {
          const dbPostId = postIdMap.get(post.id);
          if (!dbPostId) continue;

          const postComments = await fetchPostComments(post.id);
          const commentCount = await processComments(postComments, dbPostId, agentIdMap);
          stats.commentsProcessed += commentCount;
        } catch (error) {
          stats.errors.push(`Failed to process comments for post ${post.id}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        postsFetchedFromMoltbook: moltbookPosts.length,
      },
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
