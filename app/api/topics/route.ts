import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { topics, signals, topicPosts } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get latest signal for each topic and join with topic info
    const latestSignals = await db
      .select({
        topicId: topics.id,
        topicName: topics.name,
        topicDescription: topics.description,
        compositeScore: signals.compositeScore,
        velocity: signals.velocity,
        novelty: signals.novelty,
        polarization: signals.polarization,
        timestamp: signals.timestamp,
      })
      .from(topics)
      .leftJoin(
        signals,
        eq(topics.id, signals.topicId)
      )
      .orderBy(desc(signals.timestamp))
      .limit(100);

    // Get post counts for each topic
    const postCounts = await db
      .select({
        topicId: topicPosts.topicId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(topicPosts)
      .groupBy(topicPosts.topicId);

    const postCountMap = new Map(
      postCounts.map((pc) => [pc.topicId, pc.count])
    );

    // Combine data
    const topicsWithSignals = latestSignals.map((signal) => ({
      id: signal.topicId,
      name: signal.topicName || 'Unnamed Topic',
      description: signal.topicDescription,
      compositeScore: signal.compositeScore || 0,
      velocity: signal.velocity || 0,
      novelty: signal.novelty || 0,
      polarization: signal.polarization || 0,
      postCount: postCountMap.get(signal.topicId) || 0,
    }));

    // Sort by composite score
    topicsWithSignals.sort((a, b) => b.compositeScore - a.compositeScore);

    return NextResponse.json(topicsWithSignals);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
