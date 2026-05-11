import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bot, CalendarClock, FileAudio, FileVideo, FolderOpen, ImagePlus, Play, Power, Sparkles } from "lucide-react";
import "./styles.css";

type Status = "idle" | "running" | "done" | "error";
type TtsStatus = Status | "loading";

function App() {
  const [scheduler, setScheduler] = useState<SchedulerState>({ enabled: false });
  const [botStatus, setBotStatus] = useState<Status>("idle");
  const [manualStatus, setManualStatus] = useState<Status>("idle");
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>("idle");
  const [message, setMessage] = useState("");
  const [lastBotRun, setLastBotRun] = useState<BotRunResult | null>(null);
  const [lastManualRun, setLastManualRun] = useState<RenderResult | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ttsLanguage, setTtsLanguage] = useState("ru-RU");
  const [ttsAudioPath, setTtsAudioPath] = useState<string | undefined>();
  const [script, setScript] = useState(
    "Казахстан сегодня обсуждает одну тему: цены, городские проблемы и реакцию людей в Threads. Объясни коротко, почему это важно, что изменилось и чем это может закончиться."
  );

  useEffect(() => {
    void window.contentFarm.getScheduler().then(setScheduler);
  }, []);

  const canRunManual = useMemo(() => script.trim().length > 0 && manualStatus !== "running", [script, manualStatus]);

  async function runBot() {
    setBotStatus("running");
    setMessage("Running Kazakhstan daily bot...");
    try {
      const result = await window.contentFarm.runKazakhstanBot();
      setLastBotRun(result);
      setBotStatus("done");
      setMessage(`Created ${result.videoPath}`);
      setScheduler(await window.contentFarm.getScheduler());
    } catch (error) {
      setBotStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function toggleScheduler() {
    const next = await window.contentFarm.setSchedulerEnabled(!scheduler.enabled);
    setScheduler(next);
  }

  async function choosePhotos() {
    const selected = await window.contentFarm.selectPhotos();
    if (selected.length) setPhotos(selected);
  }

  async function renderManual() {
    setManualStatus("running");
    setMessage("Rendering manual video draft...");
    try {
      const result = await window.contentFarm.renderManual(script, photos, ttsAudioPath);
      setLastManualRun(result);
      setManualStatus("done");
      setMessage(`Created ${result.videoPath}`);
    } catch (error) {
      setManualStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function generateTts() {
    setTtsStatus("loading");
    setMessage("Generating Puter voice...");
    try {
      await ensurePuter();
      if (!window.puter?.ai?.txt2speech) throw new Error("Puter TTS is not available.");
      setTtsStatus("running");
      const audio = await window.puter.ai.txt2speech(script, ttsLanguage);
      await audio.play().catch(() => undefined);
      const response = await fetch(audio.src);
      if (!response.ok) throw new Error(`Could not fetch generated audio: ${response.status}`);
      const blob = await response.blob();
      const audioPath = await window.contentFarm.saveTtsAudio(await blobToBase64(blob), extensionFromMime(blob.type));
      setTtsAudioPath(audioPath);
      setTtsStatus("done");
      setMessage(`Saved voice audio ${audioPath}`);
    } catch (error) {
      setTtsStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>ContentFarm</strong>
            <span>Local automation console</span>
          </div>
        </div>

        <nav>
          <a className="active">
            <Bot size={18} />
            Kazakhstan bot
          </a>
          <a>
            <FileVideo size={18} />
            Manual video
          </a>
          <a>
            <CalendarClock size={18} />
            Schedule
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Kazakhstan Threads Daily</h1>
            <p>Creates a 9:16 TikTok/Reels/Shorts draft from Threads-provider, X API, or local seed trends.</p>
          </div>
          <button className={scheduler.enabled ? "toggle on" : "toggle"} onClick={toggleScheduler}>
            <Power size={17} />
            {scheduler.enabled ? "Daily on" : "Daily off"}
          </button>
        </header>

        <div className="grid">
          <section className="panel primaryPanel">
            <div className="panelHeader">
              <div>
                <h2>Automated KZ Bot</h2>
                <p>Runs the persona, ranks sources, writes a Russian script, and renders a draft MP4.</p>
              </div>
              <button className="primaryButton" disabled={botStatus === "running"} onClick={runBot}>
                <Play size={18} />
                {botStatus === "running" ? "Running" : "Run now"}
              </button>
            </div>

            <div className="metrics">
              <Metric label="Cadence" value="24h" />
              <Metric label="Language" value="ru-KZ" />
              <Metric label="Format" value="9:16" />
              <Metric label="Sources" value="Threads / X / seed" />
            </div>

            {lastBotRun && <ResultBlock result={lastBotRun} topic={lastBotRun.selectedTopic} />}
          </section>

          <section className="panel schedulePanel">
            <h2>Schedule</h2>
            <dl className="scheduleList">
              <div>
                <dt>Status</dt>
                <dd>{scheduler.enabled ? "Enabled" : "Disabled"}</dd>
              </div>
              <div>
                <dt>Next run</dt>
                <dd>{formatDate(scheduler.nextRunAt)}</dd>
              </div>
              <div>
                <dt>Last run</dt>
                <dd>{formatDate(scheduler.lastRunAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="panel manualPanel">
            <div className="panelHeader">
              <div>
                <h2>Manual Script + Photos</h2>
                <p>Paste a script, attach photos, and render a vertical draft.</p>
              </div>
              <button className="secondaryButton" onClick={choosePhotos}>
                <ImagePlus size={18} />
                Photos
              </button>
            </div>
            <textarea value={script} onChange={(event) => setScript(event.target.value)} />
            <div className="manualFooter">
              <div className="manualMeta">
                <span>{photos.length} photo{photos.length === 1 ? "" : "s"} selected</span>
                <span>{ttsAudioPath ? "Voice attached" : "No voice attached"}</span>
              </div>
              <div className="manualActions">
                <select value={ttsLanguage} onChange={(event) => setTtsLanguage(event.target.value)}>
                  <option value="ru-RU">Russian</option>
                  <option value="en-US">English</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="es-ES">Spanish</option>
                  <option value="it-IT">Italian</option>
                </select>
                <button className="secondaryButton" disabled={ttsStatus === "loading" || ttsStatus === "running"} onClick={generateTts}>
                  <FileAudio size={18} />
                  {ttsStatus === "loading" || ttsStatus === "running" ? "Voice" : "Puter voice"}
                </button>
              </div>
              <button className="primaryButton" disabled={!canRunManual} onClick={renderManual}>
                <FileVideo size={18} />
                {manualStatus === "running" ? "Rendering" : "Render video"}
              </button>
            </div>
            {lastManualRun && <ResultBlock result={lastManualRun} />}
          </section>
        </div>

        <footer className={message ? "statusLine visible" : "statusLine"}>{message}</footer>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResultBlock({ result, topic }: { result: RenderResult; topic?: string }) {
  return (
    <div className="result">
      {topic && <p className="topic">{topic}</p>}
      <div className="resultRow">
        <span>{result.videoPath}</span>
        <button title="Show video in folder" onClick={() => window.contentFarm.showItem(result.videoPath)}>
          <FolderOpen size={17} />
        </button>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function ensurePuter(): Promise<void> {
  if (window.puter?.ai?.txt2speech) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-puter="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Puter.js")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.dataset.puter = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Puter.js"));
    document.body.appendChild(script);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read audio blob."));
    reader.readAsDataURL(blob);
  });
}

function extensionFromMime(mime: string): string {
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("aac")) return "aac";
  if (mime.includes("flac")) return "flac";
  return "mp3";
}

createRoot(document.getElementById("root")!).render(<App />);
