// One-time (or re-run-when-the-golden-set-changes) script: pushes GOLDEN_DATASET into
// Langfuse as a Dataset with one Dataset Item per case. run-eval.ts then pulls this dataset
// back out and runs the pipeline + Opus judge against each item.
//
// Usage: npm run eval:seed
//
// Re-running does NOT delete/replace existing items with the same content — Langfuse dataset
// items aren't keyed by our case `id`, so re-seeding after edits will add duplicates. If you
// change golden-dataset.ts, clear the dataset in the Langfuse UI first, or use a fresh
// DATASET_NAME below.

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LangfuseClient } from '@langfuse/client';
import { GOLDEN_DATASET } from './golden-dataset.ts';

// dotenv/config only loads `.env` by default — this project's real config lives in
// `.env.local` (see ../../src/lib/config.ts), same file Next.js itself reads.
loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env.local') });

const DATASET_NAME = 'guest-refund-triage-golden-v2';

async function main() {
  const langfuse = new LangfuseClient();

  try {
    await langfuse.api.datasets.create({
      name: DATASET_NAME,
      description: 'Golden eval set from eval-criteria.md / product-brief.md §7.1 — full issue-category × legitimacy-spectrum grid, plus a bias-audit pair and consistency-check cases.',
      metadata: { source: 'web/scripts/eval/golden-dataset.ts', caseCount: GOLDEN_DATASET.length },
    });
    console.log(`Created dataset "${DATASET_NAME}".`);
  } catch (err) {
    console.log(`Dataset "${DATASET_NAME}" already exists (or create failed) — continuing to add items. (${(err as Error).message})`);
  }

  let added = 0;
  for (const goldenCase of GOLDEN_DATASET) {
    await langfuse.dataset.createItem({
      datasetName: DATASET_NAME,
      input: { bundle: goldenCase.bundle, submission: goldenCase.submission },
      expectedOutput: goldenCase.expected,
      metadata: { caseId: goldenCase.id, ...goldenCase.metadata },
    });
    added += 1;
    process.stdout.write(`\rSeeded ${added}/${GOLDEN_DATASET.length} items`);
  }
  console.log(`\nDone — ${added} items pushed to "${DATASET_NAME}".`);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
