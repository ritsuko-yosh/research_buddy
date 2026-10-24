/**
 * Vercel serverless function: plain-language summary of a PUBLIC clinical-trial
 * study description. (Option B1 — LLM proxy.)
 *
 * SAFETY (mirrors .kiro/steering/safety.md):
 *  - Input is PUBLIC ClinicalTrials.gov registry text only. No patient data,
 *    so no PHI and no HIPAA exposure.
 *  - The model is instructed to SUMMARIZE ONLY — add nothing, invent nothing,
 *    give no medical/eligibility advice, preserve numbers/units, and never
 *    imply the reader does or does not qualify.
 *  - The frontend always keeps the ORIGINAL description visible and labels this
 *    output as AI-generated and unreviewed.
 *  - The API key lives ONLY in this server function's env (SUMMARY_API_KEY),
 *    never in the browser bundle.
 *
 * Request  (POST, JSON): { text: string, lang?: "en" | "es" }
 * Response (JSON):        { summary: string } | { error: string }
 */

export const config = { runtime: "edge" };

const MODEL = process.env.SUMMARY_MODEL ?? "gpt-4o-mini";
const API_BASE = process.env.SUMMARY_API_BASE ?? "https://api.openai.com/v1";
const MAX_INPUT_CHARS = 6000;

// Allowed site origins for CORS. Override via SUMMARY_ALLOWED_ORIGIN.
const DEFAULT_ALLOWED = "https://ritsuko-yosh.github.io";

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = process.env.SUMMARY_ALLOWED_ORIGIN ?? DEFAULT_ALLOWED;
  // Allow the configured site and localhost dev origins.
  const ok =
    origin &&
    (origin === allowed || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? (origin as string) : allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

const SYSTEM_PROMPT = `You rewrite a PUBLIC clinical trial study description into plain language a layperson can understand.

STRICT RULES:
- Summarize ONLY what is in the provided text. Do NOT add facts, context, or anything not present.
- Do NOT give medical advice, do NOT predict or imply eligibility, do NOT tell the reader whether they qualify.
- Preserve all numbers, units, dosages, and time windows exactly.
- Keep it short: 2-4 short sentences, neutral and factual.
- If the text is too technical to simplify safely, say so briefly instead of guessing.
- Never invent study contacts, locations, recruitment status, or outcomes.
Output only the plain-language summary, nothing else.`;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const key = process.env.SUMMARY_API_KEY;
  if (!key) {
    // Not configured yet: tell the client clearly so it falls back to the
    // original registry text rather than showing a broken state.
    return new Response(JSON.stringify({ error: "summary_unavailable" }), { status: 503, headers });
  }

  let body: { text?: unknown; lang?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_INPUT_CHARS) : "";
  const lang = body.lang === "es" ? "es" : "en";
  if (text.length < 20) {
    return new Response(JSON.stringify({ error: "text_too_short" }), { status: 400, headers });
  }

  const userPrompt =
    lang === "es"
      ? `Resume en español sencillo el siguiente texto de un estudio clínico:\n\n${text}`
      : `Summarize the following clinical trial study text in plain English:\n\n${text}`;

  try {
    const resp = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "upstream_error" }), { status: 502, headers });
    }
    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return new Response(JSON.stringify({ error: "empty_summary" }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ summary }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "request_failed" }), { status: 502, headers });
  }
}
