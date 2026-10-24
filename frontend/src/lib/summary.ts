/**
 * Client for the AI plain-language summary (Option B1 — Vercel LLM proxy).
 *
 * SAFETY:
 *  - This NEVER replaces the original registry description; the caller shows the
 *    summary alongside the preserved full text and labels it AI-generated.
 *  - Any failure (no endpoint configured, network, upstream error, timeout)
 *    resolves to `null` so the UI falls back to the original text gracefully.
 *  - The endpoint holds the API key server-side; no key is ever in the browser.
 *
 * Configure the endpoint via VITE_SUMMARY_ENDPOINT, e.g.
 *   https://visit-ready.vercel.app/api/summarize
 * If unset, summarization is simply disabled (app still works fully).
 */

const TIMEOUT_MS = 12_000;

/** Read the endpoint at call time so env stubs (and tests) are honored. */
function getEndpoint(): string | undefined {
  return import.meta.env?.VITE_SUMMARY_ENDPOINT as string | undefined;
}

/** True when a summary endpoint is configured for this build. */
export function isSummaryEnabled(): boolean {
  const endpoint = getEndpoint();
  return typeof endpoint === "string" && endpoint.length > 0;
}

/**
 * Session cache of resolved summaries, keyed by (lang + text). Each unique study
 * description is summarized AT MOST ONCE per browser session, so repeat views,
 * React StrictMode double-effects, and language toggles do not re-bill the LLM.
 * This directly protects a small API spending cap. Cleared on page reload.
 */
const summaryCache = new Map<string, string | null>();
/** In-flight requests, so concurrent callers for the same key share one fetch. */
const inFlight = new Map<string, Promise<string | null>>();

function cacheKey(text: string, lang: "en" | "es"): string {
  return `${lang}::${text}`;
}

/** Test/maintenance helper: clear the session summary cache. */
export function clearSummaryCache(): void {
  summaryCache.clear();
  inFlight.clear();
}

async function requestSummary(text: string, lang: "en" | "es"): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(getEndpoint() as string, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { summary?: string };
    const summary = typeof data.summary === "string" ? data.summary.trim() : "";
    return summary.length > 0 ? summary : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Request a plain-language summary of public study text. Returns the summary
 * string, or `null` if summarization is disabled or anything goes wrong.
 *
 * Results are cached per session so each study is summarized only once per
 * language. A `null` result (failure) is NOT cached, so a transient error can
 * be retried on a later view.
 */
export async function fetchPlainLanguageSummary(
  text: string,
  lang: "en" | "es",
): Promise<string | null> {
  if (!isSummaryEnabled() || !text || text.trim().length < 20) return null;

  const key = cacheKey(text, lang);
  if (summaryCache.has(key)) return summaryCache.get(key) ?? null;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = requestSummary(text, lang)
    .then((result) => {
      // Cache only successful summaries; allow retry after a failure.
      if (result !== null) summaryCache.set(key, result);
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}
