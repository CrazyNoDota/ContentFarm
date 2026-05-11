import type { Persona, TrendItem } from "../types.js";

type ProviderItem = Record<string, unknown>;

export async function fetchThreadsProviderTrends(persona: Persona): Promise<TrendItem[]> {
  const providerUrl = process.env.THREADS_PROVIDER_URL;
  if (!providerUrl) return [];

  const allItems: TrendItem[] = [];
  for (const keyword of persona.keywords) {
    const url = new URL(providerUrl);
    url.searchParams.set("query", keyword);
    url.searchParams.set("limit", "20");

    const response = await fetch(url, {
      headers: process.env.THREADS_PROVIDER_API_KEY
        ? { Authorization: `Bearer ${process.env.THREADS_PROVIDER_API_KEY}` }
        : undefined
    });
    if (!response.ok) {
      throw new Error(`Threads provider search failed for "${keyword}": ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    const providerItems = Array.isArray(body)
      ? body
      : Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.results)
            ? body.results
            : [];

    allItems.push(...providerItems.map((item: ProviderItem, index: number) => mapProviderItem(item, keyword, index)));
  }

  return allItems;
}

function mapProviderItem(item: ProviderItem, keyword: string, index: number): TrendItem {
  const id = String(item.id ?? item.pk ?? item.code ?? `${keyword}-${index}`);
  return {
    id,
    platform: "threads",
    author: asString(item.username ?? item.author ?? item.user),
    text: asString(item.text ?? item.caption ?? item.body ?? item.content) ?? "",
    url: asString(item.url ?? item.permalink ?? item.link),
    createdAt: asString(item.created_at ?? item.createdAt ?? item.timestamp),
    metrics: {
      likes: asNumber(item.like_count ?? item.likes),
      replies: asNumber(item.reply_count ?? item.replies ?? item.comments),
      reposts: asNumber(item.repost_count ?? item.reposts),
      quotes: asNumber(item.quote_count ?? item.quotes),
      views: asNumber(item.view_count ?? item.views)
    }
  };
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
