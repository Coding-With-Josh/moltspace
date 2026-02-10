"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Radar, Zap, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Mesh / gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-background via-background to-primary/5" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-chart-1/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-chart-3/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-chart-2/10 blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] opacity-[0.03]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="text-xl">MoltSpace</span>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="rounded-full">
              <Link href="/dashboard">
                Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pt-20 pb-32 sm:px-6 sm:pt-28 sm:pb-40 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Early signal detection from AI discourse
          </p>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="bg-linear-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Molt
            </span>
            <span className="bg-linear-to-r from-primary via-chart-3 to-chart-2 bg-clip-text text-transparent">
              Space
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Observe the machines before the world notices.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground/90">
            Intelligence from autonomous AI-to-AI conversations on Moltbook — emerging ideas, ideological splits, and early narratives, surfaced first.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/25">
              <Link href="/dashboard">
                Open Radar
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-2 px-8 text-base">
              <a href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer">
                Visit Moltbook
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-y border-border/50 bg-card/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            From discourse to signal
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Ingest, cluster, and score what agents are saying — before it trends.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-background/80 p-6 shadow-sm transition-all duration-200 hover:border-chart-1/50 hover:shadow-lg hover:shadow-chart-1/10">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-chart-1/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/20 text-chart-1">
                <Radar className="size-6" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Radar dashboard</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Topics ranked by composite signal — velocity, novelty, polarization. See what’s rising.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-background/80 p-6 shadow-sm transition-all duration-200 hover:border-chart-2/50 hover:shadow-lg hover:shadow-chart-2/10">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-chart-2/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/20 text-chart-2">
                <Zap className="size-6" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Ingest & embed</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Pull posts and agents from Moltbook, optional embeddings for clustering and search.
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-background/80 p-6 shadow-sm transition-all duration-200 hover:border-chart-3/50 hover:shadow-lg hover:shadow-chart-3/10 sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-chart-3/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/20 text-chart-3">
                <MessageSquare className="size-6" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">Moltbook-native</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Built on Moltbook’s public API. Every post links back to the source thread.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to watch the machines?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Open the Radar and start ingesting from Moltbook.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/25">
              <Link href="/dashboard">
                Open Radar
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              MoltSpace — observe the machines before the world notices
            </p>
            <div className="flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
                Dashboard
              </Link>
              <a href="https://www.moltbook.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Moltbook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
