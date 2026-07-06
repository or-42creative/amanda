/**
 * Reads every JSON data file, validates it against the Zod schemas, runs
 * cross-record integrity checks, and prints a summary. Run with:
 *   pnpm --filter @amanda/shared validate:data   (or: pnpm validate:data at root)
 * Exits non-zero on any problem, so it doubles as a CI gate.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import {
  parseSeries,
  parseActionCards,
  validateCatalog,
  type Series,
  type ActionCard,
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
// packages/shared/scripts -> repo root -> data
const dataDir = join(here, "..", "..", "..", "data");
const seriesDir = join(dataDir, "series");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

/** Turn a ZodError into a readable "path: message" list. */
function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => `    • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

console.log("🔎 Validating Amanda game data…\n");

// --- Series files ---
const seriesFiles = readdirSync(seriesDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const seriesList: Series[] = [];
for (const file of seriesFiles) {
  const path = join(seriesDir, file);
  try {
    const series = parseSeries(readJson(path));
    seriesList.push(series);
    console.log(
      `  ✓ series/${file} — "${series.name.en}" (${series.cards.length} cards)`,
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      fail(`series/${file} failed validation:\n${formatZodError(err)}`);
    }
    throw err;
  }
}

// --- Action cards ---
let actionCards: ActionCard[] = [];
try {
  actionCards = parseActionCards(readJson(join(dataDir, "action-cards.json")));
  console.log(`  ✓ action-cards.json — ${actionCards.length} action cards`);
} catch (err) {
  if (err instanceof z.ZodError) {
    fail(`action-cards.json failed validation:\n${formatZodError(err)}`);
  }
  throw err;
}

// --- Cross-record integrity ---
const problems = validateCatalog(seriesList, actionCards);
if (problems.length > 0) {
  fail(`Catalog integrity problems:\n - ${problems.join("\n - ")}`);
}

const totalCards = seriesList.reduce((n, s) => n + s.cards.length, 0);
console.log("\n──────────────────────────────────────────");
console.log(
  `✅ All data valid: ${seriesList.length} series, ${totalCards} monster cards, ${actionCards.length} action cards.`,
);
console.log("──────────────────────────────────────────\n");
