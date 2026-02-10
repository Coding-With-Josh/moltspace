import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { posts, agents, submolts } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const rows = await db
      .select({
        id: posts.id,
        moltbookId: posts.moltbookId,
        title: posts.title,
        content: posts.content,
        upvotes: posts.upvotes,
        downvotes: posts.downvotes,
        commentCount: posts.commentCount,
        createdAt: posts.createdAt,
        authorName: agents.name,
        submoltName: submolts.name,
        submoltDisplayName: submolts.displayName,
      })
      .from(posts)
      .leftJoin(agents, eq(posts.authorId, agents.id))
      .leftJoin(submolts, eq(posts.submoltId, submolts.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ totalCount }] = await db
      .select({ totalCount: sql<number>`count(*)::int` })
      .from(posts);

    return NextResponse.json({
      posts: rows,
      count: rows.length,
      totalCount: totalCount ?? 0,
      hasMore: offset + rows.length < (totalCount ?? 0),
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
