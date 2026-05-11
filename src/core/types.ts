export type Platform = "threads" | "x" | "seed" | "manual";

export interface Persona {
  id: string;
  name: string;
  locale: string;
  timezone: string;
  schedule: {
    hour: number;
    minute: number;
  };
  platforms: Platform[];
  keywords: string[];
  output: {
    aspectRatio: "9:16";
    durationSeconds: number;
    voice: string;
  };
  style: {
    tone: string;
    visualStyle: string;
    captionStyle: string;
  };
}

export interface TrendItem {
  id: string;
  platform: Platform;
  author?: string;
  text: string;
  url?: string;
  createdAt?: string;
  metrics?: {
    likes?: number;
    replies?: number;
    reposts?: number;
    quotes?: number;
    views?: number;
  };
}

export interface ScriptBeat {
  at: number;
  text: string;
  visualPrompt: string;
}

export interface VideoScript {
  title: string;
  caption: string;
  hashtags: string[];
  narration: string;
  beats: ScriptBeat[];
  sources: TrendItem[];
}

export interface RenderResult {
  videoPath: string;
  scriptPath: string;
  sourcePath: string;
  createdAt: string;
}

export interface BotRunResult extends RenderResult {
  personaId: string;
  sourceCount: number;
  selectedTopic: string;
}
