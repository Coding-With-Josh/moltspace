CREATE TYPE "public"."signal_type" AS ENUM('velocity', 'novelty', 'polarization', 'influence', 'composite');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moltbook_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"karma" integer DEFAULT 0,
	"follower_count" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"last_seen_at" timestamp DEFAULT now(),
	"ingested_at" timestamp DEFAULT now(),
	CONSTRAINT "agents_moltbook_id_unique" UNIQUE("moltbook_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moltbook_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"author_id" uuid,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"ingested_at" timestamp DEFAULT now(),
	CONSTRAINT "comments_moltbook_id_unique" UNIQUE("moltbook_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moltbook_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" uuid,
	"submolt_id" uuid,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"ingested_at" timestamp DEFAULT now(),
	"embedding" text,
	CONSTRAINT "posts_moltbook_id_unique" UNIQUE("moltbook_id")
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"velocity" integer DEFAULT 0,
	"novelty" integer DEFAULT 0,
	"polarization" integer DEFAULT 0,
	"influence" integer DEFAULT 0,
	"composite_score" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "submolts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moltbook_id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"subscriber_count" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"last_activity_at" timestamp,
	"ingested_at" timestamp DEFAULT now(),
	CONSTRAINT "submolts_moltbook_id_unique" UNIQUE("moltbook_id")
);
--> statement-breakpoint
CREATE TABLE "topic_posts" (
	"topic_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"centroid_embedding" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_agents_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_agents_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_submolt_id_submolts_id_fk" FOREIGN KEY ("submolt_id") REFERENCES "public"."submolts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_posts" ADD CONSTRAINT "topic_posts_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_posts" ADD CONSTRAINT "topic_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agents_moltbook_id_idx" ON "agents" USING btree ("moltbook_id");--> statement-breakpoint
CREATE INDEX "agents_name_idx" ON "agents" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "comments_moltbook_id_idx" ON "comments" USING btree ("moltbook_id");--> statement-breakpoint
CREATE INDEX "comments_post_id_idx" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "comments_parent_id_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "comments_author_id_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_moltbook_id_idx" ON "posts" USING btree ("moltbook_id");--> statement-breakpoint
CREATE INDEX "posts_author_id_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_submolt_id_idx" ON "posts" USING btree ("submolt_id");--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "signals_topic_id_idx" ON "signals" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "signals_timestamp_idx" ON "signals" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "signals_composite_score_idx" ON "signals" USING btree ("composite_score");--> statement-breakpoint
CREATE UNIQUE INDEX "submolts_moltbook_id_idx" ON "submolts" USING btree ("moltbook_id");--> statement-breakpoint
CREATE INDEX "submolts_name_idx" ON "submolts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_posts_pk" ON "topic_posts" USING btree ("topic_id","post_id");--> statement-breakpoint
CREATE INDEX "topic_posts_topic_id_idx" ON "topic_posts" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "topic_posts_post_id_idx" ON "topic_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "topics_name_idx" ON "topics" USING btree ("name");