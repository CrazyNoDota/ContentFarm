import type { Persona, TrendItem, VideoScript } from "../types.js";

interface ChatCompletion {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function generateScript(persona: Persona, trends: TrendItem[]): Promise<VideoScript> {
  if (process.env.LLM_API_KEY && process.env.LLM_MODEL) {
    const llmScript = await tryGenerateWithLlm(persona, trends);
    if (llmScript) return llmScript;
  }
  return generateTemplateScript(persona, trends);
}

export function generateManualScript(script: string, photos: string[]): VideoScript {
  const sentences = splitSentences(script);
  const beats = (sentences.length ? sentences : [script]).slice(0, 6).map((sentence, index) => ({
    at: index * 5,
    text: sentence,
    visualPrompt: photos[index % Math.max(photos.length, 1)] ?? "manual image"
  }));

  return {
    title: firstLine(script) || "Manual TikTok Draft",
    caption: "Draft video created in ContentFarm.",
    hashtags: ["#tiktok", "#reels", "#shorts"],
    narration: script,
    beats,
    sources: []
  };
}

async function tryGenerateWithLlm(persona: Persona, trends: TrendItem[]): Promise<VideoScript | null> {
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openrouter.ai/v1";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write Russian-language Kazakhstan short-form news scripts. Return valid JSON only with title, caption, hashtags, narration, beats. Beats must have at, text, visualPrompt."
        },
        {
          role: "user",
          content: JSON.stringify({
            persona,
            trends: trends.slice(0, 8),
            requiredShape: {
              title: "string",
              caption: "string",
              hashtags: ["string"],
              narration: "string",
              beats: [{ at: 0, text: "string", visualPrompt: "string" }]
            }
          })
        }
      ]
    })
  });

  if (!response.ok) {
    console.warn(`LLM script generation failed: ${response.status} ${response.statusText}`);
    return null;
  }

  const body = (await response.json()) as ChatCompletion;
  const content = body.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Omit<VideoScript, "sources">;
    return {
      ...parsed,
      sources: trends
    };
  } catch {
    return null;
  }
}

function generateTemplateScript(persona: Persona, trends: TrendItem[]): VideoScript {
  const top = trends[0];
  const second = trends[1];
  const third = trends[2];
  const topic = top ? cleanForSpeech(top.text) : "в казахстанских Threads снова спорят о главной теме дня";
  const contrast = second ? cleanForSpeech(second.text) : "люди спорят не только о фактах, но и о том, кто выигрывает от этой истории";
  const extra = third ? cleanForSpeech(third.text) : "по реакции видно: тема уже ушла дальше одного поста";

  const beats = [
    {
      at: 0,
      text: "Казахстанский Threads сегодня взорвался из-за одной темы.",
      visualPrompt: "fast vertical social feed, Kazakhstan city lights, urgent news energy"
    },
    {
      at: 3,
      text: topic,
      visualPrompt: persona.style.visualStyle
    },
    {
      at: 10,
      text: contrast,
      visualPrompt: "split-screen comments, reaction counters, Almaty and Astana context"
    },
    {
      at: 18,
      text: extra,
      visualPrompt: "zooming screenshots, kinetic captions, Central Asia social media"
    },
    {
      at: 24,
      text: "Самое странное: обсуждение растет быстрее, чем появляются нормальные объяснения.",
      visualPrompt: "dramatic data pulse, notification storm, Russian captions"
    },
    {
      at: 28,
      text: "Напиши в комментариях: это реально важная тема или очередной шум?",
      visualPrompt: "comment prompt, bold TikTok caption, Kazakhstan audience"
    }
  ];

  const narration = beats.map((beat) => beat.text).join(" ");
  return {
    title: `Threads KZ: ${firstLine(topic)}`,
    caption: "Главное обсуждение дня в Казахстане, коротко и без воды.",
    hashtags: ["#казахстан", "#алматы", "#астана", "#threads", "#tiktokkz"],
    narration,
    beats,
    sources: trends
  };
}

function splitSentences(input: string): string[] {
  return input
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function firstLine(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 70);
}

function cleanForSpeech(input: string): string {
  return input
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}
