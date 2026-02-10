import { pgTable, uuid, text, integer, timestamp, pgEnum, index, uniqueIndex, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Enums
export const signalTypeEnum = pgEnum('signal_type', ['velocity', 'novelty', 'polarization', 'influence', 'composite']);

// Tables
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  moltbookId: text('moltbook_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  karma: integer('karma').default(0),
  followerCount: integer('follower_count').default(0),
  createdAt: timestamp('created_at').notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
  ingestedAt: timestamp('ingested_at').defaultNow(),
}, (table) => ({
  moltbookIdIdx: uniqueIndex('agents_moltbook_id_idx').on(table.moltbookId),
  nameIdx: index('agents_name_idx').on(table.name),
}));

export const submolts = pgTable('submolts', {
  id: uuid('id').primaryKey().defaultRandom(),
  moltbookId: text('moltbook_id').notNull().unique(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  subscriberCount: integer('subscriber_count').default(0),
  createdAt: timestamp('created_at').notNull(),
  lastActivityAt: timestamp('last_activity_at'),
  ingestedAt: timestamp('ingested_at').defaultNow(),
}, (table) => ({
  moltbookIdIdx: uniqueIndex('submolts_moltbook_id_idx').on(table.moltbookId),
  nameIdx: index('submolts_name_idx').on(table.name),
}));

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  moltbookId: text('moltbook_id').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => agents.id),
  submoltId: uuid('submolt_id').references(() => submolts.id),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  commentCount: integer('comment_count').default(0),
  createdAt: timestamp('created_at').notNull(),
  ingestedAt: timestamp('ingested_at').defaultNow(),
  embedding: text('embedding'), // JSON array or pgvector - will be handled via migrations
}, (table) => ({
  moltbookIdIdx: uniqueIndex('posts_moltbook_id_idx').on(table.moltbookId),
  authorIdIdx: index('posts_author_id_idx').on(table.authorId),
  submoltIdIdx: index('posts_submolt_id_idx').on(table.submoltId),
  createdAtIdx: index('posts_created_at_idx').on(table.createdAt),
  // Vector index will be created via migration
}));

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  moltbookId: text('moltbook_id').notNull().unique(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): any => comments.id),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => agents.id),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  createdAt: timestamp('created_at').notNull(),
  ingestedAt: timestamp('ingested_at').defaultNow(),
}, (table) => ({
  moltbookIdIdx: uniqueIndex('comments_moltbook_id_idx').on(table.moltbookId),
  postIdIdx: index('comments_post_id_idx').on(table.postId),
  parentIdIdx: index('comments_parent_id_idx').on(table.parentId),
  authorIdIdx: index('comments_author_id_idx').on(table.authorId),
  createdAtIdx: index('comments_created_at_idx').on(table.createdAt),
}));

export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  centroidEmbedding: text('centroid_embedding'), // JSON array or pgvector - will be handled via migrations
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: index('topics_name_idx').on(table.name),
  // Vector index will be created via migration
}));

export const topicPosts = pgTable('topic_posts', {
  topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => ({
  pk: uniqueIndex('topic_posts_pk').on(table.topicId, table.postId),
  topicIdIdx: index('topic_posts_topic_id_idx').on(table.topicId),
  postIdIdx: index('topic_posts_post_id_idx').on(table.postId),
}));

export const signals = pgTable('signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  velocity: integer('velocity').default(0), // Posts per time window
  novelty: integer('novelty').default(0), // 0-100 score
  polarization: integer('polarization').default(0), // 0-100 score
  influence: integer('influence').default(0), // 0-100 score
  compositeScore: integer('composite_score').default(0), // Weighted combination
}, (table) => ({
  topicIdIdx: index('signals_topic_id_idx').on(table.topicId),
  timestampIdx: index('signals_timestamp_idx').on(table.timestamp),
  compositeScoreIdx: index('signals_composite_score_idx').on(table.compositeScore),
}));

// Relations
export const agentsRelations = relations(agents, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const submoltsRelations = relations(submolts, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(agents, {
    fields: [posts.authorId],
    references: [agents.id],
  }),
  submolt: one(submolts, {
    fields: [posts.submoltId],
    references: [submolts.id],
  }),
  comments: many(comments),
  topics: many(topicPosts),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  author: one(agents, {
    fields: [comments.authorId],
    references: [agents.id],
  }),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  posts: many(topicPosts),
  signals: many(signals),
}));

export const topicPostsRelations = relations(topicPosts, ({ one }) => ({
  topic: one(topics, {
    fields: [topicPosts.topicId],
    references: [topics.id],
  }),
  post: one(posts, {
    fields: [topicPosts.postId],
    references: [posts.id],
  }),
}));

export const signalsRelations = relations(signals, ({ one }) => ({
  topic: one(topics, {
    fields: [signals.topicId],
    references: [topics.id],
  }),
}));
