import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { paths } from "./paths.js";
import type { Persona } from "./types.js";

const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  locale: z.string(),
  timezone: z.string(),
  schedule: z.object({
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59)
  }),
  platforms: z.array(z.enum(["threads", "x", "seed", "manual"])),
  keywords: z.array(z.string()).min(1),
  output: z.object({
    aspectRatio: z.literal("9:16"),
    durationSeconds: z.number().int().min(10).max(180),
    voice: z.string()
  }),
  style: z.object({
    tone: z.string(),
    visualStyle: z.string(),
    captionStyle: z.string()
  })
});

export async function loadPersona(id: string): Promise<Persona> {
  const filePath = path.join(paths.personas, `${id}.json`);
  const raw = await readFile(filePath, "utf8");
  return personaSchema.parse(JSON.parse(raw));
}
