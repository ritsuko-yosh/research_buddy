# AI Plain-Language Summary — Vercel Setup (Option B1)

The "About this study" section can show an **optional** AI-generated plain-language
summary of the public registry description. It is additive and safety-gated:

- The **original registry description is always preserved** (shown directly, or in
  a "Full study description" dropdown when a summary is present).
- The summary is **clearly labeled as AI-generated and unreviewed**.
- If the endpoint is not configured, or any request fails/times out, the app
  **falls back to the original text** — nothing breaks.
- Input is **public trial text only** (no patient data → no PHI → no HIPAA exposure).
- The LLM **API key lives only in the Vercel function**, never in the browser.

## Architecture

```
Browser (GitHub Pages)  --POST /api/summarize-->  Vercel function  --> LLM API
   src/lib/summary.ts                               api/summarize.ts     (key in env)
```

## One-time setup (repo admin)

1. **Create a Vercel project** from this repo (Vercel auto-detects `api/summarize.ts`).
2. **Add environment variables** in the Vercel project settings:
   - `SUMMARY_API_KEY` — your LLM provider API key (required).
   - `SUMMARY_API_BASE` — optional, default `https://api.openai.com/v1`
     (any OpenAI-compatible chat completions endpoint works).
   - `SUMMARY_MODEL` — optional, default `gpt-4o-mini`.
   - `SUMMARY_ALLOWED_ORIGIN` — optional, default `https://ritsuko-yosh.github.io`.
3. **Deploy.** Note the function URL, e.g. `https://<project>.vercel.app/api/summarize`.
4. **Point the frontend at it.** Set `VITE_SUMMARY_ENDPOINT` in the GitHub Pages
   build (as a repo/Actions variable used by `.github/workflows/deploy.yml`) to
   that URL, then re-run the deploy. If unset, summarization stays disabled and
   the app runs normally on registry text.

## Safety prompt

The function instructs the model to summarize ONLY the provided text, add
nothing, give no medical/eligibility advice, preserve numbers/units, and refuse
to simplify if it cannot do so safely. See `api/summarize.ts`.
