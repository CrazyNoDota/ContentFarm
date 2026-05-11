import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureWorkspace, paths } from "./paths.js";
import type { BotRunResult } from "./types.js";
import { runKazakhstanThreadsBot } from "./bots/kazakhstanBot.js";

interface SchedulerState {
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
}

const statePath = path.join(paths.state, "scheduler.json");

export class DailyBotScheduler {
  private timer?: NodeJS.Timeout;
  private running = false;

  async getState(): Promise<SchedulerState> {
    await ensureWorkspace();
    try {
      return JSON.parse(await readFile(statePath, "utf8")) as SchedulerState;
    } catch {
      return { enabled: false };
    }
  }

  async setEnabled(enabled: boolean): Promise<SchedulerState> {
    const nextRunAt = enabled ? computeNextRun().toISOString() : undefined;
    const state = { ...(await this.getState()), enabled, nextRunAt };
    await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
    this.arm(state);
    return state;
  }

  async boot(): Promise<void> {
    this.arm(await this.getState());
  }

  async runNow(): Promise<BotRunResult> {
    if (this.running) throw new Error("Bot run is already in progress.");
    this.running = true;
    try {
      const result = await runKazakhstanThreadsBot();
      const state = await this.getState();
      if (state.enabled) {
        const nextState = {
          ...state,
          lastRunAt: result.createdAt,
          nextRunAt: computeNextRun().toISOString()
        };
        await writeFile(statePath, JSON.stringify(nextState, null, 2), "utf8");
        this.arm(nextState);
      }
      return result;
    } finally {
      this.running = false;
    }
  }

  private arm(state: SchedulerState): void {
    if (this.timer) clearTimeout(this.timer);
    if (!state.enabled || !state.nextRunAt) return;
    const delay = Math.max(1_000, new Date(state.nextRunAt).getTime() - Date.now());
    this.timer = setTimeout(() => {
      void this.runNow().catch((error) => console.error(error));
    }, delay);
  }
}

function computeNextRun(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}
