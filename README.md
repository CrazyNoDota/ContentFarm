# ContentFarm

Desktop-first automation console for persona-driven short-form video production.

The first implemented bot is `kazakhstan-threads`: once per 24 hours it can collect Kazakhstan-relevant discussion from a Threads search provider, X API recent search, and local seed data, then render a TikTok/Reels/Shorts-ready 9:16 MP4 draft.

## What is included

- Electron desktop app with:
  - Kazakhstan bot run button.
  - 24-hour daily scheduler toggle.
  - Manual script + photos video renderer.
- Persona file architecture in `personas/`.
- Source adapters:
  - Threads generic provider adapter via `THREADS_PROVIDER_URL`.
  - X official API v2 recent search via `X_BEARER_TOKEN`.
  - Offline seed fallback in `data/seeds/`.
- Script engine:
  - Optional OpenAI-compatible LLM endpoint.
  - Deterministic Russian fallback template when no LLM key is configured.
- FFmpeg-based vertical video draft rendering.

## Current platform decision

The bot does not automate logged-in browser scraping or account evasion. Threads trend ingestion is behind a provider adapter because Meta's public Threads API is useful for publishing, reply management, reading owned content, and insights, but general public keyword trend search is not the reliable first integration surface. X ingestion uses official X API v2 recent search when a bearer token is present.

Useful references checked while building this version:

- X API overview and pay-per-use access: https://docs.x.com/x-api
- X recent search endpoint: https://docs.x.com/x-api/posts/recent-search
- X search posts guide: https://docs.x.com/x-api/posts/search/introduction
- Meta Threads API launch context: https://techcrunch.com/2024/06/18/threads-finally-launches-its-api-for-developers/

## Setup

```bash
npm install
cp .env.example .env
npm run build
npm start
```

For development:

```bash
npm run dev
```

Run the first bot without the desktop app:

```bash
npm run bot:kz
```

Outputs are written to `outputs/`.

## Real source configuration

Edit `.env`:

```env
X_BEARER_TOKEN=...
THREADS_PROVIDER_URL=https://your-provider.example/search
THREADS_PROVIDER_API_KEY=...
LLM_BASE_URL=https://api.openrouter.ai/v1
LLM_API_KEY=...
LLM_MODEL=...
```

The Threads provider endpoint should accept `query` and `limit` query parameters. It can return an array, or an object with `items`, `data`, or `results`.

## MVP roadmap

1. Add verified Threads provider integration and normalize its exact response schema.
2. Add TTS provider and audio waveform/subtitle timing.
3. Add TikTok/Instagram/YouTube upload adapters through official publishing APIs or approved schedulers.
4. Add a queue database for VPS deployment.
5. Add persona management UI for more niche bots.
