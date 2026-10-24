/**
 * Build the demo cache envelopes and shared normalized fixtures from the real
 * ClinicalTrials.gov records saved at src/data/cache/{nctId}.raw.json.
 *
 * For each curated demo study, outputs:
 *   src/data/cache/{nctId}.cache.json   (raw record + fetch timestamp)
 *   fixtures/trial.{nctId}.json         (normalized Trial for Person A)
 *   fixtures/preparation-card.{nctId}.json
 *   fixtures/coordinator-inquiry.{nctId}.{en,es}.txt
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { normalizeStudy } from "../src/pipeline/normalize.js";
import { enrichTrial } from "../src/pipeline/enrich.js";
import { buildPreparationCard, buildCoordinatorInquiry } from "../src/pipeline/prepare.js";
import { CURATED_DEMO_NCT_IDS } from "../src/data/demo.js";
import type { RawStudy } from "../src/pipeline/raw.js";

const root = join(import.meta.dirname, "..");
const cacheDir = join(root, "src", "data", "cache");
const fixturesDir = join(root, "fixtures");
mkdirSync(fixturesDir, { recursive: true });

// Fixed reference clock so committed fixtures are deterministic.
const fixedNow = new Date("2026-10-24T00:00:00.000Z");

for (const nctId of CURATED_DEMO_NCT_IDS) {
  const raw = JSON.parse(readFileSync(join(cacheDir, `${nctId}.raw.json`), "utf8")) as RawStudy;

  const fetchedAt = new Date().toISOString();
  writeFileSync(join(cacheDir, `${nctId}.cache.json`), JSON.stringify({ raw, fetchedAt }, null, 2));

  const trial = enrichTrial(normalizeStudy(raw, { source: "cache", fetchedAt, now: fixedNow }));

  writeFileSync(join(fixturesDir, `trial.${nctId}.json`), JSON.stringify(trial, null, 2));
  writeFileSync(
    join(fixturesDir, `preparation-card.${nctId}.json`),
    JSON.stringify(buildPreparationCard(trial, "en"), null, 2),
  );
  writeFileSync(join(fixturesDir, `coordinator-inquiry.${nctId}.en.txt`), buildCoordinatorInquiry(trial, "en"));
  writeFileSync(join(fixturesDir, `coordinator-inquiry.${nctId}.es.txt`), buildCoordinatorInquiry(trial, "es"));

  const counts = trial.criteria.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});
  const curated = trial.criteria.filter((c) => c.explanationEn).length;
  console.log(`Built fixture for ${nctId}: ${trial.criteria.length} criteria, ${JSON.stringify(counts)}`);
  console.log(`  curated explanations: ${curated} | language: ${trial.languageRequirement.status} | contacts: ${trial.contacts.length} | stale: ${trial.dataSource.stale}`);
}
