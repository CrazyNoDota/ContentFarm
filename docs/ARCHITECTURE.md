# Architecture Notes

## Shape

The app follows the Master/SubAgent idea from `AI Content Factory Blueprint & Tools.md`, but starts with one concrete SubAgent:

- `personas/kazakhstan-threads.json` defines language, schedule, keywords, style, and output format.
- `src/core/sources/*` collects candidate posts.
- `src/core/scoring.ts` ranks Kazakhstan relevance and engagement.
- `src/core/script/generator.ts` produces a 30-second Russian script.
- `src/core/video/renderer.ts` renders a 1080x1920 MP4 draft.
- `electron/*` exposes this through a desktop app.

## Source Policy

Threads and X have changed materially over time, so source adapters are explicit and replaceable:

- X uses official API v2 recent search if `X_BEARER_TOKEN` is set.
- Threads uses a generic provider URL because public keyword trend search is not treated as a stable native Threads API capability for this MVP.
- Local seed data is always included so the bot can be tested without keys.

## VPS-Ready Direction

The desktop app calls the same core functions that a VPS worker can call. For hosting later, keep `src/core` and replace Electron IPC with:

- HTTP API server.
- Persistent queue.
- Object storage for renders.
- Cron or worker scheduler.

The renderer already uses FFmpeg, which is a good fit for VPS deployment.
