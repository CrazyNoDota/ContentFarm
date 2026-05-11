import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("contentFarm", {
  runKazakhstanBot: () => ipcRenderer.invoke("bot:runKazakhstan"),
  getScheduler: () => ipcRenderer.invoke("scheduler:get"),
  setSchedulerEnabled: (enabled: boolean) => ipcRenderer.invoke("scheduler:setEnabled", enabled),
  selectPhotos: () => ipcRenderer.invoke("manual:selectPhotos"),
  renderManual: (script: string, photos: string[]) => ipcRenderer.invoke("manual:render", { script, photos }),
  showItem: (filePath: string) => ipcRenderer.invoke("shell:showItem", filePath)
});
