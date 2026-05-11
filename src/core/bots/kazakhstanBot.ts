import path from "node:path";
import { writeFile } from "node:fs/promises";
import { config as loadEnv } from "dotenv";
import { ensureWorkspace, paths } from "../paths.js";
import { loadPersona } from "../persona.js";
import { pickTopTrends } from "../scoring.js";
import { fetchTrends } from "../sources/index.js";
import { generateManualScript, generateScript } from "../script/generator.js";
import { renderVerticalVideo } from "../video/renderer.js";
import type { BotRunResult, RenderResult } from "../types.js";

loadEnv();

export async function runKazakhstanThreadsBot(): Promise<BotRunResult> {
  await ensureWorkspace();
  const persona = await loadPersona("kazakhstan-threads");
  const rawTrends = await fetchTrends(persona);
  const selected = pickTopTrends(rawTrends, 8);
  const script = await generateScript(persona, selected);
  const render = await renderVerticalVideo(script, {
    idPrefix: persona.id,
    durationSeconds: persona.output.durationSeconds
  });

  const runRecord: BotRunResult = {
    ...render,
    personaId: persona.id,
    sourceCount: rawTrends.length,
    selectedTopic: selected[0]?.text.slice(0, 120) ?? "Seed topic"
  };
  await writeFile(path.join(paths.state, `${persona.id}-last-run.json`), JSON.stringify(runRecord, null, 2), "utf8");
  return runRecord;
}

export async function renderManualVideo(scriptText: string, photos: string[]): Promise<RenderResult> {
  await ensureWorkspace();
  const script = generateManualScript(scriptText, photos);
  return renderVerticalVideo(script, {
    idPrefix: "manual",
    durationSeconds: 30,
    photos
  });
}
