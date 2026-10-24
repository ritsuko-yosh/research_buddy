/**
 * Build the demo cache envelope and the shared normalized fixture from the real
 * ClinicalTrials.gov record saved at src/data/cache/NCT02896335.raw.json.
 *
 * Outputs:
 *   src/data/cache/NCT02896335.cache.json   (raw record + fetch timestamp)
 *   fixtures/trial.NCT02896335.json         (normalized Trial for Person A)
 *   fixtures/preparation-card.NCT02896335.json
 *
 * The `fetchedAt` records when we actually retrieved the record from the API.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { normalizeStudy } from "../src/pipeline/normalize.js";
import { enrichTrial } from "../src/pipeline/enrich.js";
import { buildPreparationCard, buildCoordinatorInquiry } from "../src/pipeline/prepare.js";
import { DEMO_NCT_ID } from "../src/data/demo.js";
import type { RawStudy } from "../src/pipeline/raw.js";

const root = join(import.meta.dirname, "..");
const cacheDir = join(root, "src", "data", "cache");
const fixturesDir = join(root, "fixtures");
mkdirSync(fixturesDir, { recursive: true });

const raw = JSON.parse(
  readFileSync(join(cacheDir, `${DEMO_NCT_ID}.raw.json`), "utf8"),
) as RawStudy;

// Record the real retrieval timestamp for this cached record.
const fetchedAt = new Date().toISOString();
const envelope = { raw, fetchedAt };
writeFileSync(
  join(cacheDir, `${DEMO_NCT_ID}.cache.json`),
  JSON.stringify(envelope, null, 2),
);

// Use a FIXED reference clock so the committed fixture is deterministic.
const fixedNow = new Date("2026-10-24T00:00:00.000Z");
const trial = enrichTrial(
  normalizeStudy(raw, {
    source: "cache",
    fetchedAt,
    now: fixedNow,
  }),
);

writeFileSync(
  join(fixturesDir, `trial.${DEMO_NCT_ID}.json`),
  JSON.stringify(trial, null, 2),
);

const card = buildPreparationCard(trial, "en");
writeFileSync(
  join(fixturesDir, `preparation-card.${DEMO_NCT_ID}.json`),
  JSON.stringify(card, null, 2),
);

const inquiryEn = buildCoordinatorInquiry(trial, "en");
const inquiryEs = buildCoordinatorInquiry(trial, "es");
writeFileSync(
  join(fixturesDir, `coordinator-inquiry.${DEMO_NCT_ID}.en.txt`),
  inquiryEn,
);
writeFileSync(
  join(fixturesDir, `coordinator-inquiry.${DEMO_NCT_ID}.es.txt`),
  inquiryEs,
);

const counts = trial.criteria.reduce<Record<string, number>>((acc, c) => {
  acc[c.category] = (acc[c.category] ?? 0) + 1;
  return acc;
}, {});

console.log("Built fixture for", DEMO_NCT_ID);
console.log("  criteria:", trial.criteria.length);
console.log("  category counts:", JSON.stringify(counts));
console.log("  language requirement:", trial.languageRequirement.status);
console.log("  contacts:", trial.contacts.length);
console.log("  MA locations:", trial.locations.filter((l) => l.state === "Massachusetts").length);
console.log("  stale:", trial.dataSource.stale);
