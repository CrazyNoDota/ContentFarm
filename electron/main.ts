import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { renderManualVideo } from "../src/core/bots/kazakhstanBot.js";
import { DailyBotScheduler } from "../src/core/scheduler.js";

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scheduler = new DailyBotScheduler();

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 680,
    title: "ContentFarm",
    backgroundColor: "#0f1216",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  registerIpc();
  await scheduler.boot();
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function registerIpc(): void {
  ipcMain.handle("bot:runKazakhstan", async () => scheduler.runNow());
  ipcMain.handle("scheduler:get", async () => scheduler.getState());
  ipcMain.handle("scheduler:setEnabled", async (_event, enabled: boolean) => scheduler.setEnabled(Boolean(enabled)));
  ipcMain.handle("manual:selectPhotos", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select photos",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return result.canceled ? [] : result.filePaths;
  });
  ipcMain.handle("manual:render", async (_event, payload: { script: string; photos: string[] }) => {
    if (!payload.script?.trim()) throw new Error("Script is required.");
    return renderManualVideo(payload.script, payload.photos ?? []);
  });
  ipcMain.handle("shell:showItem", async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
    return true;
  });
}
