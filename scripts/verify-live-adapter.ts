/**
 * Verify the browser-safe live data source against the REAL ClinicalTrials.gov
 * API, producing the frontend's FeTrial shape. Run: npx tsx scripts/verify-live-adapter.ts
 */
import { createLiveDataSource } from "../src/browser/index.js";

const ds = createLiveDataSource();

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  console.log("=== LIVE NCT lookup: NCT02896335 (real, MGH Boston) ===");
  const fe = await ds.getTrial("NCT02896335");
  assert(fe, "getTrial returned null");
  if (!fe) return;
  console.log("nctId:", fe.nctId);
  console.log("title:", fe.title);
  console.log("recruitmentStatus (mapped):", fe.recruitmentStatus);
  console.log("dataOrigin:", fe.dataOrigin);
  console.log("registryUpdateDate:", fe.registryUpdateDate, "| dataRetrievedAt:", fe.dataRetrievedAt);
  console.log("MA locations:", fe.locations.filter((l) => l.state === "Massachusetts").map((l) => l.city));
  console.log("contacts:", fe.contacts.map((c) => c.name));
  console.log("languageRequirement:", fe.languageRequirement.status);
  const sections = fe.criteria.reduce<Record<string, number>>((a, c) => ((a[c.section] = (a[c.section] ?? 0) + 1), a), {});
  const cats = fe.criteria.reduce<Record<string, number>>((a, c) => ((a[c.category] = (a[c.category] ?? 0) + 1), a), {});
  console.log("criteria sections:", JSON.stringify(sections));
  console.log("criteria categories:", JSON.stringify(cats));
  console.log("criteria with EN plain:", fe.criteria.filter((c) => c.plainExplanation.en).length);
  console.log("criteria with ES plain:", fe.criteria.filter((c) => c.plainExplanation.es).length);
  const sample = fe.criteria.find((c) => c.plainExplanation.es);
  console.log("sample criterion translationStatus:", sample?.spanishTranslationStatus);
  const flagged = fe.criteria.find((c) => c.uncertaintyNotes.length > 0);
  console.log("sample uncertaintyNotes:", flagged?.uncertaintyNotes.slice(0, 1));

  // Validate FeTrial shape invariants.
  assert(typeof fe.recruitmentStatus === "string", "status missing");
  assert(fe.criteria.every((c) => ["inclusion", "exclusion", "unspecified"].includes(c.section)), "bad section");
  assert(fe.criteria.every((c) => typeof c.sourceText === "string" && c.sourceText.length > 0), "empty sourceText");
  assert(!("matchScore" in (fe as object)) && !("eligible" in (fe as object)), "verdict field present");

  console.log("\n=== LIVE invalid NCT -> null ===");
  const bad = await ds.getTrial("not-an-id");
  console.log("getTrial('not-an-id'):", bad);
  assert(bad === null, "invalid id should map to null");

  console.log("\n=== LIVE condition search: breast_cancer (MA, recruiting) ===");
  const results = await ds.searchByCondition("breast_cancer");
  console.log("summaries returned:", results.length);
  console.log("first 3:", results.slice(0, 3).map((r) => `${r.nctId} [${r.recruitmentStatus}] ${r.title.slice(0, 40)}`));
  assert(results.length > 0, "search returned nothing");
  assert(results.every((r) => typeof r.recruitmentStatus === "string"), "summary status missing");

  console.log("\nALL LIVE ADAPTER CHECKS PASSED ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
