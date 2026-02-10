'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { humanizeTitle, humanizeContent, formatNumber } from '@/lib/utils/readable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  compositeScore: number;
  velocity: number;
  novelty: number;
  polarization: number;
  postCount: number;
}

interface IngestedPost {
  id: string;
  moltbookId: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  authorName: string | null;
  submoltName: string | null;
  submoltDisplayName: string | null;
}

async function fetchTopics(): Promise<Topic[]> {
  const res = await fetch('/api/topics');
  if (!res.ok) {
    throw new Error('Failed to fetch topics');
  }
  return res.json();
}

async function fetchPosts(): Promise<{ posts: IngestedPost[]; totalCount: number }> {
  const res = await fetch('/api/posts?limit=50');
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  const data = await res.json();
  return { posts: data.posts ?? [], totalCount: data.totalCount ?? 0 };
}

async function fetchStats(): Promise<{ postsCount: number; agentsCount: number; error?: string }> {
  const res = await fetch('/api/stats');
  const data = await res.json();
  if (!res.ok) return { postsCount: 0, agentsCount: 0, error: data.error ?? 'Failed to load stats' };
  return { postsCount: data.postsCount ?? 0, agentsCount: data.agentsCount ?? 0 };
}

export default function DashboardPage() {
  const [ingestError, setIngestError] = React.useState<string | null>(null);
  const [ingesting, setIngesting] = React.useState(false);
  const [lastIngestStats, setLastIngestStats] = React.useState<{ fromApi: number; saved: number; errors: string[] } | null>(null);

  const { data: topics, isLoading: topicsLoading, error: topicsError } = useQuery({
    queryKey: ['topics'],
    queryFn: fetchTopics,
    refetchInterval: 30000,
  });

  const { data: postsData, isLoading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    refetchInterval: 30000,
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 10000,
  });

  const isLoading = topicsLoading;
  const error = topicsError;
  const posts = postsData?.posts ?? [];
  const totalPosts = postsData?.totalCount ?? 0;
  const postsInDb = stats?.postsCount ?? 0;
  const agentsInDb = stats?.agentsCount ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading topics: {error.message}</p>
      </div>
    );
  }

  const hasTopics = topics && topics.length > 0;
  const hasPosts = posts.length > 0;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-linear-to-br from-primary/8 via-background to-chart-2/10 p-6 md:p-8">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Radar Dashboard
          </h2>
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
            Live
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          Early signals from autonomous AI discourse on Moltbook
        </p>
        {stats && (
          <div className="mt-4 flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-1/15 px-3 py-1 text-sm font-medium text-chart-1">
              <span className="size-1.5 rounded-full bg-chart-1" />
              {postsInDb} posts
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/15 px-3 py-1 text-sm font-medium text-chart-2">
              <span className="size-1.5 rounded-full bg-chart-2" />
              {agentsInDb} agents
            </span>
            {stats.error && (
              <span className="text-sm text-destructive">{stats.error}</span>
            )}
          </div>
        )}
      </div>

      {ingestError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4">
            <strong className="text-destructive">Ingestion failed:</strong> {ingestError}
          </CardContent>
        </Card>
      )}

      {lastIngestStats && (
        <Card className="border-chart-1/30 bg-chart-1/5">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Last ingestion:</strong> {lastIngestStats.fromApi} posts from Moltbook → {lastIngestStats.saved} saved to DB.
            {lastIngestStats.errors.length > 0 && (
              <div className="mt-2 text-amber-600 dark:text-amber-400">
                {lastIngestStats.errors.slice(0, 3).map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasTopics && !hasPosts && (
        <Card className="border-primary/20 bg-linear-to-b from-primary/5 to-transparent">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              No data yet. Start by ingesting data from Moltbook.
            </p>
            {postsInDb > 0 && (
              <p className="text-amber-600 dark:text-amber-400 mb-4 text-sm">
              You have {postsInDb} posts in the database but they didn’t load. Check the browser console or try refreshing.
            </p>
          )}
            <Button
              disabled={ingesting}
              onClick={async () => {
                setIngestError(null);
                setIngesting(true);
                try {
                  const res = await fetch('/api/ingest', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    setLastIngestStats({
                      fromApi: data.stats?.postsFetchedFromMoltbook ?? 0,
                      saved: data.stats?.postsProcessed ?? 0,
                      errors: data.stats?.errors ?? [],
                    });
                    await Promise.all([refetchPosts(), refetchStats()]);
                    setIngestError(null);
                  } else {
                    setIngestError(data.error ?? 'Unknown error');
                  }
                } catch (e) {
                  setIngestError(e instanceof Error ? e.message : String(e));
                } finally {
                  setIngesting(false);
                }
              }}
            >
              {ingesting ? 'Ingesting…' : 'Start Ingestion'}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasTopics && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Topics (by signal)
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, i) => (
              <Card
                key={topic.id}
                className="group relative overflow-hidden border-l-4 bg-card transition-all duration-200 hover:shadow-md"
                style={{ borderLeftColor: `var(--chart-${(i % 5) + 1})` }}
              >
                <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full opacity-[0.08] transition-opacity group-hover:opacity-[0.14]" style={{ backgroundColor: `var(--chart-${(i % 5) + 1})` }} />
                <CardHeader className="relative flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-base pr-8">{topic.name}</CardTitle>
                  <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground shadow-sm">
                    {topic.compositeScore}
                  </span>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {topic.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{topic.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-chart-2/20 px-2.5 py-1 text-xs font-semibold text-chart-2">
                      V {topic.velocity}
                    </span>
                    <span className="rounded-full bg-chart-3/20 px-2.5 py-1 text-xs font-semibold text-chart-3">
                      N {topic.novelty}
                    </span>
                    <span className="rounded-full bg-chart-1/20 px-2.5 py-1 text-xs font-semibold text-chart-1">
                      {topic.postCount} posts
                    </span>
                  </div>
                  <a
                    href={`/topic/${topic.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-opacity"
                  >
                    View details
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {hasPosts && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Recent ingested posts {totalPosts > 0 && `(${totalPosts} total)`}
          </h3>
          <div className="space-y-3">
            {posts.map((post, idx) => {
              const { display: titleDisplay, hint: titleHint } = humanizeTitle(post.title);
              const { summary: contentSummary, snippet } = humanizeContent(post.content);
              const chartVar = (idx % 5) + 1;
              return (
                <Card
                  key={post.id}
                  className="group relative overflow-hidden border-l-4 bg-card transition-all duration-200 hover:shadow-md"
                  style={{ borderLeftColor: `var(--chart-${chartVar})` }}
                >
                  <CardContent className="pt-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {post.submoltDisplayName && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                              {post.submoltDisplayName}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground leading-snug" title={post.title}>
                          {titleDisplay}
                          {titleHint && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              ({titleHint})
                            </span>
                          )}
                        </h4>
                        {contentSummary && (
                          <p className="text-sm font-medium text-chart-2">
                            {contentSummary}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {snippet}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {post.authorName && <span>by {post.authorName}</span>}
                          <span className="font-medium text-foreground">{formatNumber(post.upvotes)} ↑</span>
                          <span>{formatNumber(post.commentCount)} comments</span>
                        </div>
                      </div>
                      <a
                        href={`https://www.moltbook.com/post/${post.moltbookId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        Open on Moltbook →
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {!hasTopics && (
            <p className="mt-4 text-sm text-muted-foreground">
              Topic clustering and signal scores will appear here once that pipeline runs.
            </p>
          )}
        </section>
      )}

      {hasPosts && !hasTopics && (
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-center">
            <Button
              disabled={ingesting}
              onClick={async () => {
                setIngestError(null);
                setIngesting(true);
                try {
                  const res = await fetch('/api/ingest', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    setLastIngestStats({
                      fromApi: data.stats?.postsFetchedFromMoltbook ?? 0,
                      saved: data.stats?.postsProcessed ?? 0,
                      errors: data.stats?.errors ?? [],
                    });
                    await Promise.all([refetchPosts(), refetchStats()]);
                  } else {
                    setIngestError(data.error ?? 'Unknown error');
                  }
                } catch (e) {
                  setIngestError(e instanceof Error ? e.message : String(e));
                } finally {
                  setIngesting(false);
                }
              }}
            >
              {ingesting ? 'Ingesting…' : 'Run ingestion again'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
