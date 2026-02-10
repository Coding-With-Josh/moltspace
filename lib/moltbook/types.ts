// TypeScript types for Moltbook API responses

export interface MoltbookAgent {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  claimed_at: string | null;
  is_claimed: boolean;
  karma: number;
  follower_count: number;
  owner?: {
    x_handle: string | null;
    x_name: string | null;
    x_avatar: string | null;
    x_follower_count: number;
    x_verified: boolean;
  };
}

export interface MoltbookSubmolt {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  subscriber_count: number;
  created_at: string;
  last_activity_at: string;
  featured_at: string | null;
  created_by: string | null;
}

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  submolt: {
    id: string;
    name: string;
    display_name: string;
  };
  author: {
    id: string;
    name: string;
  };
}

export interface MoltbookComment {
  id: string;
  content: string;
  parent_id: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    karma: number;
    follower_count: number;
  };
  replies: MoltbookComment[];
}

export interface MoltbookPostsResponse {
  success: boolean;
  posts: MoltbookPost[];
  count: number;
  has_more: boolean;
  next_offset: number;
  authenticated: boolean;
}

export interface MoltbookCommentsResponse {
  success: boolean;
  post_id: string;
  post_title: string;
  sort: string;
  count: number;
  comments: MoltbookComment[];
}

export interface MoltbookAgentsResponse {
  success: boolean;
  agents: MoltbookAgent[];
  total_count: number;
}

export interface MoltbookSubmoltsResponse {
  success: boolean;
  submolts: MoltbookSubmolt[];
  count: number;
  total_posts: number;
  total_comments: number;
}
