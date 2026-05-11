import type { Persona, TrendItem } from "../types.js";

interface XSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
    public_metrics?: {
      like_count?: number;
      reply_count?: number;
      retweet_count?: number;
      quote_count?: number;
      impression_count?: number;
    };
  }>;
  includes?: {
    users?: Array<{ id: string; username?: string }>;
  };
}

export async function fetchXTrends(persona: Persona): Promise<TrendItem[]> {
  const bearer = process.env.X_BEARER_TOKEN;
  if (!bearer) return [];

  const query = `(${persona.keywords.map((keyword) => `"${keyword}"`).join(" OR ")}) lang:ru -is:retweet`;
  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", query);
  url.searchParams.set("max_results", "30");
  url.searchParams.set("tweet.fields", "created_at,public_metrics,author_id,lang");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer}` }
  });
  if (!response.ok) {
    throw new Error(`X recent search failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as XSearchResponse;
  const users = new Map((body.includes?.users ?? []).map((user) => [user.id, user.username]));
  return (body.data ?? []).map((tweet) => ({
    id: tweet.id,
    platform: "x",
    author: tweet.author_id ? users.get(tweet.author_id) : undefined,
    text: tweet.text,
    url: tweet.author_id ? `https://x.com/${users.get(tweet.author_id) ?? "i"}/status/${tweet.id}` : undefined,
    createdAt: tweet.created_at,
    metrics: {
      likes: tweet.public_metrics?.like_count,
      replies: tweet.public_metrics?.reply_count,
      reposts: tweet.public_metrics?.retweet_count,
      quotes: tweet.public_metrics?.quote_count,
      views: tweet.public_metrics?.impression_count
    }
  }));
}
