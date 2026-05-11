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
- Desktop TTS:
  - Puter.js voice preview and audio saving in the manual video flow.
  - Saved voice audio is muxed into the rendered MP4.
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

For NVIDIA NIM / DeepSeek, use the OpenAI-compatible settings without committing the key:

```env
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_API_KEY=your_rotated_key
LLM_MODEL=deepseek-ai/deepseek-v4-pro
LLM_TEMPERATURE=1
LLM_TOP_P=0.95
LLM_MAX_TOKENS=16384
LLM_RESPONSE_FORMAT=off
LLM_EXTRA_BODY={"chat_template_kwargs":{"thinking":false}}
```

For Replicate / FLUX image generation, keep it disabled until you want each render to spend image credits:

```env
REPLICATE_API_TOKEN=your_rotated_token
REPLICATE_IMAGE_ENABLED=true
REPLICATE_IMAGE_MODEL=black-forest-labs/flux-2-pro
REPLICATE_IMAGE_RESOLUTION=1 MP
REPLICATE_IMAGE_ASPECT_RATIO=9:16
REPLICATE_IMAGE_FORMAT=webp
REPLICATE_IMAGE_QUALITY=80
REPLICATE_SAFETY_TOLERANCE=2
```

Puter.js TTS is loaded in the desktop renderer from `https://js.puter.com/v2/`. In the manual video panel, choose a language, click `Puter voice`, then render the video. The saved audio is stored in `outputs/` and attached to the MP4.

## MVP roadmap

1. Add verified Threads provider integration and normalize its exact response schema.
2. Add server-side TTS provider for VPS automation plus subtitle timing.
3. Add TikTok/Instagram/YouTube upload adapters through official publishing APIs or approved schedulers.
4. Add a queue database for VPS deployment.
5. Add persona management UI for more niche bots.
