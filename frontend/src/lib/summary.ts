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

const ENDPOINT = import.meta.env?.VITE_SUMMARY_ENDPOINT as string | undefined;
const TIMEOUT_MS = 12_000;

/** True when a summary endpoint is configured for this build. */
export function isSummaryEnabled(): boolean {
  return typeof ENDPOINT === "string" && ENDPOINT.length > 0;
}

/**
 * Request a plain-language summary of public study text. Returns the summary
 * string, or `null` if summarization is disabled or anything goes wrong.
 */
export async function fetchPlainLanguageSummary(
  text: string,
  lang: "en" | "es",
): Promise<string | null> {
  if (!isSummaryEnabled() || !text || text.trim().length < 20) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT as string, {
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
