import type { TrendItem } from "./types.js";

const kazakhstanSignals = [
  "казахстан",
  "алматы",
  "астана",
  "актау",
  "шымкент",
  "тенге",
  "кз",
  "qazaqstan",
  "kazakhstan"
];

export function scoreTrend(item: TrendItem): number {
  const text = item.text.toLowerCase();
  const signalScore = kazakhstanSignals.filter((word) => text.includes(word)).length * 25;
  const metrics = item.metrics ?? {};
  const engagement =
    (metrics.likes ?? 0) * 1 +
    (metrics.replies ?? 0) * 3 +
    (metrics.reposts ?? 0) * 4 +
    (metrics.quotes ?? 0) * 4 +
    Math.floor((metrics.views ?? 0) / 100);
  const recency = item.createdAt ? Math.max(0, 24 - hoursSince(item.createdAt)) * 2 : 8;
  return signalScore + engagement + recency;
}

export function pickTopTrends(items: TrendItem[], limit = 8): TrendItem[] {
  const seen = new Set<string>();
  return [...items]
    .filter((item) => {
      const key = normalizeText(item.text).slice(0, 160);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => scoreTrend(b) - scoreTrend(a))
    .slice(0, limit);
}

export function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

function hoursSince(dateLike: string): number {
  const timestamp = new Date(dateLike).getTime();
  if (Number.isNaN(timestamp)) return 24;
  return (Date.now() - timestamp) / 3_600_000;
}
