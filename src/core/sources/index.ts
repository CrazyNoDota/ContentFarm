import type { Persona, TrendItem } from "../types.js";
import { fetchSeedTrends } from "./seedSource.js";
import { fetchThreadsProviderTrends } from "./threadsProviderSource.js";
import { fetchXTrends } from "./xSource.js";

export async function fetchTrends(persona: Persona): Promise<TrendItem[]> {
  const sources: Promise<TrendItem[]>[] = [];
  if (persona.platforms.includes("threads")) sources.push(fetchThreadsProviderTrends(persona));
  if (persona.platforms.includes("x")) sources.push(fetchXTrends(persona));
  sources.push(fetchSeedTrends(persona));

  const settled = await Promise.allSettled(sources);
  const failed = settled.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    console.warn("Some sources failed", failed);
  }

  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
