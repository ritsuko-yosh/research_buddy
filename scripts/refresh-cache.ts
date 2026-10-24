/**
 * Refresh the demo study's cached raw record from the live ClinicalTrials.gov
 * API, then rebuild the envelope + fixtures. Run via `npm run refresh-cache`.
 *
 * Fails safe: if the live fetch fails, the existing cached record is left
 * untouched so the demo stays reliable.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { lookupStudy } from "../src/pipeline/client.js";
import { CURATED_DEMO_NCT_IDS } from "../src/data/demo.js";

const root = join(import.meta.dirname, "..");
const cacheDir = join(root, "src", "data", "cache");
mkdirSync(cacheDir, { recursive: true });

async function main() {
  for (const nctId of CURATED_DEMO_NCT_IDS) {
    console.log(`Refreshing live record for ${nctId}...`);
    const raw = await lookupStudy(nctId);
    writeFileSync(join(cacheDir, `${nctId}.raw.json`), JSON.stringify(raw, null, 2));
  }
  console.log("Saved raw records. Rebuilding fixtures...");
  // Rebuild envelope + fixtures deterministically.
  execFileSync("npx", ["tsx", join("scripts", "build-fixture.ts")], {
    cwd: root,
    stdio: "inherit",
  });
}

main().catch((err) => {
  console.error("Refresh failed; existing cache left untouched.");
  console.error(String(err?.message ?? err));
  process.exit(1);
});
