/// <reference types="vite/client" />

interface BotRunResult {
  videoPath: string;
  scriptPath: string;
  sourcePath: string;
  createdAt: string;
  personaId: string;
  sourceCount: number;
  selectedTopic: string;
}

interface RenderResult {
  videoPath: string;
  scriptPath: string;
  sourcePath: string;
  createdAt: string;
}

interface SchedulerState {
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

interface Window {
  puter?: {
    ai?: {
      txt2speech: (text: string, language?: string) => Promise<HTMLAudioElement>;
    };
  };
  contentFarm: {
    runKazakhstanBot: () => Promise<BotRunResult>;
    getScheduler: () => Promise<SchedulerState>;
    setSchedulerEnabled: (enabled: boolean) => Promise<SchedulerState>;
    selectPhotos: () => Promise<string[]>;
    renderManual: (script: string, photos: string[], audioPath?: string) => Promise<RenderResult>;
    saveTtsAudio: (base64: string, extension: string) => Promise<string>;
    showItem: (filePath: string) => Promise<boolean>;
  };
}
