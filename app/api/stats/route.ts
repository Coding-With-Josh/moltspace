import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { posts, agents } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const [postCount] = await db.select({ count: sql<number>`count(*)::int` }).from(posts);
    const [agentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(agents);
    return NextResponse.json({
      postsCount: postCount?.count ?? 0,
      agentsCount: agentCount?.count ?? 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error', postsCount: 0, agentsCount: 0 },
      { status: 500 }
    );
  }
}
