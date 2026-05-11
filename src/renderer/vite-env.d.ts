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
  contentFarm: {
    runKazakhstanBot: () => Promise<BotRunResult>;
    getScheduler: () => Promise<SchedulerState>;
    setSchedulerEnabled: (enabled: boolean) => Promise<SchedulerState>;
    selectPhotos: () => Promise<string[]>;
    renderManual: (script: string, photos: string[]) => Promise<RenderResult>;
    showItem: (filePath: string) => Promise<boolean>;
  };
}
