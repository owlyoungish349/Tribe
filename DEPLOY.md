# Deploying to Vercel

## One-time setup

1. Push this branch to GitHub (or connect the repo in [vercel.com/new](https://vercel.com/new)).
2. Import the project — Vercel detects **Vite** via `vercel.json`.
3. Add environment variables in **Project Settings → Environment Variables**:

| Variable | Required | Notes |
|----------|----------|-------|
| `CURSOR_API_KEY` | Yes | Live agent calls |
| `LLM_MODEL` | No | Default `composer-2.5` |
| `VITE_DEMO_MODE` | No | Set `true` at **build** time for cached demo (no API key needed) |

4. Deploy. The frontend is static (`dist/`); `/api/claude` runs as a serverless function (60s max).

## CLI deploy

```bash
npx vercel login
npx vercel --prod
```

Set env vars with:

```bash
npx vercel env add CURSOR_API_KEY
```

## Local vs production

| | Local (`npm run dev`) | Vercel |
|--|----------------------|--------|
| Frontend | Vite :5173 | Static CDN |
| API | Express :8787 | `/api/claude` serverless |
| Proxy | `vite.config.ts` → :8787 | Same origin, no proxy needed |

## Notes

- Agent calls can take 15–60s. Hobby plan limits function duration to 10s — **Pro plan recommended** for live demo (this config requests 60s).
- For a no-key public demo, set `VITE_DEMO_MODE=true` before build.
