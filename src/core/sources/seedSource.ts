import { readFile } from "node:fs/promises";
import path from "node:path";
import { paths } from "../paths.js";
import type { Persona, TrendItem } from "../types.js";

export async function fetchSeedTrends(persona: Persona): Promise<TrendItem[]> {
  const filePath = path.join(paths.seedData, `${persona.id}.json`);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as TrendItem[];
}
