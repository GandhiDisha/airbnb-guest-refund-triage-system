// Runs the golden dataset through the real decision engine + narration pipeline, scores each
// case against eval-criteria.md (programmatic checks + an Opus-as-judge call), records
// everything as a Langfuse experiment/dataset run, and appends a summary to eval-results.md.
//
// Usage: npm run eval:run
// Requires: LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, ANTHROPIC_API_KEY in .env.local
// Optional: EVAL_NARRATION_MODEL (claude-haiku-4-5 | claude-sonnet-5 | claude-opus-5) — which
// model the pipeline under test narrates with. Defaults to the app's own DEFAULT_MODEL. The
// judge model is always claude-opus-5, independent of this — see eval-criteria.md "Judge model".

import { config as loadEnv } from 'dotenv';
import { writeFile, appendFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { setLangfuseTracerProvider } from '@langfuse/tracing';
import { LangfuseClient } from '@langfuse/client';
import type { Evaluation, Evaluator, RunEvaluator } from '@langfuse/client';

import { computeDecision } from '../../src/lib/decision-engine.ts';
import { generateNarrative } from '../../src/lib/generate-narrative.ts';
import { DEFAULT_MODEL } from '../../src/lib/config.ts';
import type { AgentSubmission, CaseBundle, DecisionResult, ModelId, NarrativeResult } from '../../src/lib/types.ts';
import { GOLDEN_DATASET, type GoldenCaseExpected } from './golden-dataset.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dotenv/config only loads `.env` by default — this project's real config lives in
// `.env.local` (see ../../src/lib/config.ts), same file Next.js itself reads.
loadEnv({ path: path.resolve(__dirname, '../../.env.local') });

// Standalone script, not the Next.js app — no existing OTel provider to conflict with, so an
// isolated Langfuse tracer provider is enough for runExperiment's automatic per-case tracing.
// See https://langfuse.com/docs/observability/sdk/typescript/setup#tracing-setup
const langfuseSpanProcessor = new LangfuseSpanProcessor();
setLangfuseTracerProvider(new NodeTracerProvider({ spanProcessors: [langfuseSpanProcessor] }));

const DATASET_NAME = 'guest-refund-triage-golden-v2';
const JUDGE_MODEL = 'claude-opus-5' as const; // fixed — see eval-criteria.md "Judge model"
const NARRATION_MODEL = ((process.env.EVAL_NARRATION_MODEL as ModelId | undefined) ?? DEFAULT_MODEL) as ModelId;

const RESULTS_MD_PATH = path.resolve(__dirname, '../../../eval-results.md');

type TaskInput = { bundle: CaseBundle; submission: AgentSubmission };
type TaskOutput = { decision: DecisionResult; narrative: NarrativeResult };
type CaseMetadata = { caseId: string; issueCategory: string; listingCategory: string; legitimacyPoint: string; consistencyCheck?: boolean; biasPairId?: string };

// ---------------------------------------------------------------------------
// Opus judge — groundedness, tone/liability, explainability (eval-criteria.md
// "Opus-judged checks"). One call per case, deliberately NOT given `expected` —
// these dimensions judge whether the output is internally sound, not label-matching.
// ---------------------------------------------------------------------------

const judgeSchema = z.object({
  groundedness_score: z.number().min(0).max(1).describe('Fraction of factual claims in rationale + draftResponse supported by the provided source data.'),
  unsupported_claims: z.array(z.object({ text: z.string(), reason: z.string() })).describe('Any claim not supported by the source data. Empty array if none.'),
  no_liability_admission: z.number().min(0).max(1).describe('1 if draftResponse contains no fault/negligence admission, 0 if it does.'),
  no_privacy_leak: z.number().min(0).max(1).describe('1 if draftResponse never names/identifies another guest, 0 if it does.'),
  empathetic_neutral_tone: z.number().min(0).max(1).describe('1 if draftResponse is empathetic, neutral, and does not over-promise.'),
  tone_notes: z.string().describe('Explanation for any of the three tone sub-scores below 1. Empty string if all pass.'),
  explainability_score: z.number().min(0).max(1).describe('Could an agent read the rationale aloud and defend it to a skeptical host/guest without looking anything else up?'),
  explainability_notes: z.string(),
});
type JudgeOutput = z.infer<typeof judgeSchema>;

function renderBundleForJudge(bundle: CaseBundle): string {
  const chatLog = bundle.chatMessages.map((m) => `[${m.sentAt}] ${m.senderType}: ${m.messageText}`).join('\n') || '(no messages)';
  const reviews = bundle.otherReviews.map((r) => `- (${r.rating}/5) ${r.reviewText}`).join('\n') || 'none';
  const guestHistory = bundle.guestHistory.map((c) => `- ${c.filedAt}: ${c.issueCategory} -> ${c.decision}`).join('\n') || 'none';
  const hostHistory = bundle.hostHistory.map((c) => `- ${c.filedAt}: ${c.issueCategory} -> ${c.decision} (listing ${c.listingId})`).join('\n') || 'none';
  return `Listing: "${bundle.listing.title}" (${bundle.listing.category}) — "${bundle.listing.description}" (last updated ${bundle.listing.updatedAt})
Stay: ${bundle.reservation.nightsStayed} nights, $${bundle.reservation.bookingValueUsd}, ${bundle.reservation.checkInDate} to ${bundle.reservation.checkOutDate}

CHAT LOG:
${chatLog}

OTHER GUEST REVIEWS (aggregate only):
${reviews}

THIS GUEST'S PAST CASES:
${guestHistory}

THIS HOST'S PAST CASES:
${hostHistory}`;
}

function buildJudgePrompt(bundle: CaseBundle, submission: AgentSubmission, decision: DecisionResult, narrative: NarrativeResult): string {
  const amountLine =
    decision.decision === 'deny'
      ? 'No refund.'
      : decision.needsManualReview
        ? `Range: $${decision.refundRangeLow}-$${decision.refundRangeHigh} (confidence ${decision.confidence}%)`
        : `Amount: $${decision.refundAmount} (confidence ${decision.confidence}%)`;

  return `You are grading the output of an automated Airbnb refund-triage tool against three quality dimensions. You are NOT re-deciding the refund — the decision below is fixed and already computed deterministically. Grade only whether the generated text is grounded, safe to send, and defensible.

SOURCE DATA (everything the narration model was allowed to cite):
${renderBundleForJudge(bundle)}

AGENT-ENTERED FIELDS:
- Issue category: ${submission.issueCategory}
- Evidence provided: ${submission.evidenceOfClaim || '(none)'}
- Host response time reported: ${submission.hostResponseTimeHrs ?? '(not provided)'} hours

COMPUTED DECISION (fixed, not being judged): ${decision.decision}. ${amountLine}. Safety escalation: ${decision.safetyEscalation}.
Timing classification: ${decision.factors.timingBucket}
Contributing factors (the narrator was given these and told to cite them — citing them is grounded, NOT an unsupported claim): severity=${decision.factors.baseSeverityPct}, evidence=${decision.factors.evidenceMultiplier}, timing=${decision.factors.timingMultiplier}, stayImpact=${decision.factors.stayImpactFraction}, guestCredibility=${decision.factors.guestCredibilityMultiplier}, hostAccountability=${decision.factors.hostAccountabilityMultiplier}
Matched guest message (if any): ${decision.factors.matchedGuestMessage ? `"${decision.factors.matchedGuestMessage.messageText}" (${decision.factors.matchedGuestMessage.sentAt})` : 'none — no chat message matched this issue category'}

GENERATED RATIONALE (internal, agent-facing):
${narrative.rationale}

GENERATED DRAFT RESPONSE (guest-facing):
${narrative.draftResponse}

Score three dimensions:

1. GROUNDEDNESS — read the rationale and draft response claim by claim. A claim (timestamp, quoted/paraphrased message, listing detail, history fact, review excerpt) is unsupported if it doesn't appear in the source data above, misattributes a message (e.g. host message attributed to guest), or contradicts the source data. Report groundedness_score as the fraction of claims that ARE supported, and list every unsupported claim.

2. TONE & LIABILITY — judge only the draft response. no_liability_admission: does it avoid admitting fault/negligence (neutral problem descriptions like "the AC was not working" are fine; "this was our fault" is not)? no_privacy_leak: does it avoid naming/identifying another guest? empathetic_neutral_tone: is it empathetic without being cold, and does it avoid over-promising ("we'll make sure this never happens again")?

3. EXPLAINABILITY — judge only the rationale. Could a support agent read it aloud to defend the decision to a skeptical host or guest, without looking anything else up? Does it cite specific evidence rather than just restating computed factor numbers?`;
}

async function judgeCase(bundle: CaseBundle, submission: AgentSubmission, decision: DecisionResult, narrative: NarrativeResult): Promise<JudgeOutput> {
  const { output } = await generateText({
    model: anthropic(JUDGE_MODEL),
    output: Output.object({ schema: judgeSchema }),
    prompt: buildJudgePrompt(bundle, submission, decision, narrative),
  });
  return output;
}

// ---------------------------------------------------------------------------
// Programmatic checks (eval-criteria.md "Programmatic checks")
// ---------------------------------------------------------------------------

function scoreRefundAmount(expected: GoldenCaseExpected, actual: DecisionResult): { value: number; comment: string } {
  const hasExpectedPoint = expected.refundAmount != null;
  const actualHasPoint = actual.refundAmount != null;
  const actualHasRange = actual.refundRangeLow != null && actual.refundRangeHigh != null;

  if (hasExpectedPoint) {
    const expectedAmount = expected.refundAmount as number;
    if (actualHasPoint) {
      const within = Math.abs((actual.refundAmount as number) - expectedAmount) / expectedAmount <= 0.1;
      return { value: within ? 1 : 0, comment: `point: actual=$${actual.refundAmount} expected=$${expectedAmount}` };
    }
    if (actualHasRange) {
      const brackets = (actual.refundRangeLow as number) <= expectedAmount && expectedAmount <= (actual.refundRangeHigh as number);
      const width = (actual.refundRangeHigh as number) - (actual.refundRangeLow as number);
      const tooWide = width > 0.6 * expectedAmount;
      return { value: brackets ? 1 : 0, comment: `range [$${actual.refundRangeLow}-$${actual.refundRangeHigh}] vs expected $${expectedAmount}${tooWide ? ' — range too wide to be useful' : ''}` };
    }
    return { value: 0, comment: `expected $${expectedAmount} but decision produced no amount or range (decision=${actual.decision})` };
  }

  // Expected itself is a range (disputed-edge-case golden label) — correct tool behavior is
  // to also be uncertain (produce a range), and for that range to overlap the expert's.
  const expLow = expected.refundRangeLow as number;
  const expHigh = expected.refundRangeHigh as number;
  if (actualHasRange) {
    const overlap = (actual.refundRangeLow as number) <= expHigh && expLow <= (actual.refundRangeHigh as number);
    return { value: overlap ? 1 : 0, comment: `tool range [$${actual.refundRangeLow}-$${actual.refundRangeHigh}] vs expert range [$${expLow}-$${expHigh}]` };
  }
  if (actualHasPoint) {
    const withinExpertRange = (actual.refundAmount as number) >= expLow && (actual.refundAmount as number) <= expHigh;
    return { value: withinExpertRange ? 0.5 : 0, comment: `tool was falsely confident (point $${actual.refundAmount}) on a case experts flagged disputed, expert range [$${expLow}-$${expHigh}]` };
  }
  return { value: 0, comment: `expert expected a refund range [$${expLow}-$${expHigh}] but tool denied` };
}

const programmaticEvaluator: Evaluator<TaskInput, GoldenCaseExpected, Record<string, any>> = async ({ output, expectedOutput, metadata }) => {
  const { decision } = output as TaskOutput;
  const expected = expectedOutput as GoldenCaseExpected;
  const caseMetadata = metadata as CaseMetadata | undefined;
  const evals: Evaluation[] = [
    { name: 'decision_accuracy', value: decision.decision === expected.decision ? 1 : 0, comment: `actual=${decision.decision} expected=${expected.decision}` },
  ];

  if (expected.decision !== 'deny') {
    const refund = scoreRefundAmount(expected, decision);
    evals.push({ name: 'refund_amount_accuracy', value: refund.value, comment: refund.comment });
  }

  if (caseMetadata?.issueCategory === 'Safety/Security') {
    evals.push({
      name: 'safety_escalation_recall',
      value: decision.safetyEscalation ? 1 : 0,
      comment: decision.safetyEscalation ? 'escalated correctly' : 'MISSED — Safety/Security case not escalated',
    });
  }

  return evals;
};

const opusJudgeEvaluator: Evaluator<TaskInput, GoldenCaseExpected, Record<string, any>> = async ({ input, output, metadata }) => {
  const { bundle, submission } = input;
  const { decision, narrative } = output as TaskOutput;
  const judged = await judgeCase(bundle, submission, decision, narrative);
  console.log(`  judged ${(metadata as CaseMetadata | undefined)?.caseId ?? '?'} -> groundedness=${judged.groundedness_score}`);
  const unsupportedSummary = judged.unsupported_claims.length
    ? judged.unsupported_claims.map((c) => `"${c.text}" — ${c.reason}`).join('; ')
    : 'none';
  return [
    { name: 'groundedness', value: judged.groundedness_score, comment: `unsupported claims: ${unsupportedSummary}` },
    { name: 'no_liability_admission', value: judged.no_liability_admission },
    { name: 'no_privacy_leak', value: judged.no_privacy_leak },
    { name: 'empathetic_neutral_tone', value: judged.empathetic_neutral_tone, comment: judged.tone_notes },
    { name: 'explainability', value: judged.explainability_score, comment: judged.explainability_notes },
  ];
};

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;
}

const aggregateEvaluator: RunEvaluator<TaskInput, GoldenCaseExpected, Record<string, any>> = async ({ itemResults }) => {
  const evals: Evaluation[] = [];
  const scoresByName = (name: string) =>
    itemResults.flatMap((r) => r.evaluations.filter((e) => e.name === name).map((e) => e.value as number));

  evals.push({ name: 'agg_decision_accuracy_rate', value: mean(scoresByName('decision_accuracy')) });
  const refundScores = scoresByName('refund_amount_accuracy');
  if (refundScores.length) evals.push({ name: 'agg_refund_amount_accuracy_rate', value: mean(refundScores) });
  const safetyScores = scoresByName('safety_escalation_recall');
  if (safetyScores.length) evals.push({ name: 'agg_safety_escalation_recall', value: mean(safetyScores) });
  evals.push({ name: 'agg_groundedness_mean', value: mean(scoresByName('groundedness')) });
  evals.push({ name: 'agg_groundedness_failure_count', value: scoresByName('groundedness').filter((v) => v < 1).length });
  evals.push({ name: 'agg_no_liability_admission_rate', value: mean(scoresByName('no_liability_admission')) });
  evals.push({ name: 'agg_no_privacy_leak_rate', value: mean(scoresByName('no_privacy_leak')) });
  evals.push({ name: 'agg_explainability_mean', value: mean(scoresByName('explainability')) });

  const pairs = new Map<string, typeof itemResults>();
  for (const r of itemResults) {
    const pairId = (r.item.metadata as CaseMetadata | undefined)?.biasPairId;
    if (pairId) pairs.set(pairId, [...(pairs.get(pairId) ?? []), r]);
  }
  for (const [pairId, members] of pairs) {
    if (members.length !== 2) continue;
    const [a, b] = members;
    const outA = a.output as TaskOutput;
    const outB = b.output as TaskOutput;
    const decisionMatch = outA.decision.decision === outB.decision.decision ? 1 : 0;
    const amtA = outA.decision.refundAmount ?? 0;
    const amtB = outB.decision.refundAmount ?? 0;
    const amountDelta = Math.max(amtA, amtB) === 0 ? 1 : 1 - Math.abs(amtA - amtB) / Math.max(amtA, amtB);
    evals.push({ name: `agg_bias_pair_${pairId}_decision_match`, value: decisionMatch });
    evals.push({ name: `agg_bias_pair_${pairId}_amount_delta`, value: amountDelta });
  }

  return evals;
};

// ---------------------------------------------------------------------------
// Consistency check (eval-criteria.md #4) — not part of the standard single-pass
// experiment; re-runs flagged cases twice more and computes variance locally.
// ---------------------------------------------------------------------------

async function runConsistencyCheck() {
  const flagged = GOLDEN_DATASET.filter((c) => c.metadata.consistencyCheck);
  const rows: { caseId: string; decisions: string[]; amounts: (number | null)[]; decisionVariance: number; amountVariance: number | null }[] = [];

  console.log(`\nConsistency check: ${flagged.length} case(s) x 3 repeated runs`);
  for (const goldenCase of flagged) {
    const decisions: string[] = [];
    const amounts: (number | null)[] = [];
    for (let i = 0; i < 3; i++) {
      const decision = computeDecision(goldenCase.submission, goldenCase.bundle);
      const narrative = await generateNarrative(goldenCase.submission, goldenCase.bundle, decision, NARRATION_MODEL);
      void narrative; // narration variance isn't scored here, only the deterministic decision
      decisions.push(decision.decision);
      amounts.push(decision.refundAmount);
      console.log(`  ${goldenCase.id} run ${i + 1}/3 -> ${decision.decision}`);
    }
    const decisionVariance = new Set(decisions).size === 1 ? 1 : 0;
    const numericAmounts = amounts.filter((a): a is number => a != null);
    let amountVariance: number | null = null;
    if (numericAmounts.length === amounts.length && numericAmounts.length > 0) {
      const m = mean(numericAmounts);
      const stddev = Math.sqrt(mean(numericAmounts.map((a) => (a - m) ** 2)));
      amountVariance = m === 0 ? 1 : Math.max(0, 1 - stddev / m);
    }
    rows.push({ caseId: goldenCase.id, decisions, amounts, decisionVariance, amountVariance });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// eval-results.md writer
// ---------------------------------------------------------------------------

function fmt(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return '—';
  return (n * 100).toFixed(0) + '%';
}

async function appendResultsMarkdown(params: {
  runName: string;
  datasetRunUrl: string | undefined;
  narrationModel: ModelId;
  runEvaluations: Evaluation[];
  itemResults: { caseId: string; evaluations: Evaluation[] }[];
  consistencyRows: Awaited<ReturnType<typeof runConsistencyCheck>>;
}) {
  const { runName, datasetRunUrl, narrationModel, runEvaluations, itemResults, consistencyRows } = params;
  const val = (name: string) => runEvaluations.find((e) => e.name === name)?.value as number | undefined;

  const decisionAccuracy = val('agg_decision_accuracy_rate');
  const safetyRecall = val('agg_safety_escalation_recall');
  const groundednessFailures = val('agg_groundedness_failure_count') ?? 0;
  const liabilityRate = val('agg_no_liability_admission_rate');
  const privacyRate = val('agg_no_privacy_leak_rate');
  const biasFailures = runEvaluations.filter(
    (e) => (e.name.includes('_decision_match') && (e.value as number) === 0) || (e.name.includes('_amount_delta') && (e.value as number) < 0.95),
  );

  const gateFailures: string[] = [];
  if ((decisionAccuracy ?? 0) < 0.85) gateFailures.push(`Decision accuracy ${fmt(decisionAccuracy)} < 85% target`);
  if (safetyRecall !== undefined && safetyRecall < 1) gateFailures.push(`Safety escalation recall ${fmt(safetyRecall)} < 100% target`);
  if (groundednessFailures > 0) gateFailures.push(`${groundednessFailures} case(s) had unsupported claims (groundedness target: zero)`);
  if (liabilityRate !== undefined && liabilityRate < 1) gateFailures.push(`Liability-admission check failed on ${((1 - liabilityRate) * (itemResults.length || 1)).toFixed(0)} case(s)`);
  if (privacyRate !== undefined && privacyRate < 1) gateFailures.push(`Privacy-leak check failed on at least one case`);
  if (biasFailures.length) gateFailures.push(`${biasFailures.length} bias-pair check(s) below threshold: ${biasFailures.map((f) => f.name).join(', ')}`);

  const lines: string[] = [];
  lines.push(`\n---\n`);
  lines.push(`## Run: ${runName}`);
  lines.push(`- **Date:** ${new Date().toISOString()}`);
  lines.push(`- **Narration model under test:** ${narrationModel}`);
  lines.push(`- **Judge model:** ${JUDGE_MODEL}`);
  if (datasetRunUrl) lines.push(`- **Langfuse dataset run:** ${datasetRunUrl}`);
  lines.push('');
  lines.push(gateFailures.length ? `### ❌ Release gate: FAILED` : `### ✅ Release gate: PASSED`);
  if (gateFailures.length) {
    lines.push('');
    for (const f of gateFailures) lines.push(`- ${f}`);
  }
  lines.push('');
  lines.push('### Aggregate scores');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|---|---|');
  for (const e of runEvaluations) lines.push(`| ${e.name} | ${typeof e.value === 'number' ? e.value.toFixed(3) : e.value} |`);
  lines.push('');
  lines.push('### Per-case scores');
  lines.push('');
  lines.push('| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const item of itemResults) {
    const v = (name: string) => {
      const e = item.evaluations.find((ev) => ev.name === name);
      return e ? (e.value as number).toFixed(2) : '—';
    };
    lines.push(
      `| ${item.caseId} | ${v('decision_accuracy')} | ${v('refund_amount_accuracy')} | ${v('safety_escalation_recall')} | ${v('groundedness')} | ${v('no_liability_admission')} | ${v('no_privacy_leak')} | ${v('empathetic_neutral_tone')} | ${v('explainability')} |`,
    );
  }
  if (consistencyRows.length) {
    lines.push('');
    lines.push('### Consistency check (3 repeated runs per flagged case)');
    lines.push('');
    lines.push('| Case | Decisions | Amounts | Decision variance | Amount variance |');
    lines.push('|---|---|---|---|---|');
    for (const row of consistencyRows) {
      lines.push(
        `| ${row.caseId} | ${row.decisions.join(', ')} | ${row.amounts.map((a) => (a == null ? '—' : `$${a}`)).join(', ')} | ${row.decisionVariance === 1 ? '✅ consistent' : '❌ INCONSISTENT'} | ${row.amountVariance == null ? 'n/a' : fmt(row.amountVariance)} |`,
      );
    }
  }
  lines.push('');

  const content = lines.join('\n');
  try {
    await access(RESULTS_MD_PATH);
    await appendFile(RESULTS_MD_PATH, content);
  } catch {
    const header = `# Eval Results — Guest Refund Triage Tool\n\nAppended to automatically by \`web/scripts/eval/run-eval.ts\` on every run. See \`eval-criteria.md\` for what each metric means and the release-gate thresholds.\n`;
    await writeFile(RESULTS_MD_PATH, header + content);
  }
  console.log(`\nAppended results to ${RESULTS_MD_PATH}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const langfuse = new LangfuseClient();
  const dataset = await langfuse.dataset.get(DATASET_NAME);

  console.log(`Running eval "${DATASET_NAME}" (${GOLDEN_DATASET.length} golden cases) — narration model: ${NARRATION_MODEL}, judge model: ${JUDGE_MODEL}`);

  try {
    let completed = 0;
    const result = await dataset.runExperiment({
      name: 'guest-refund-triage-eval',
      description: `Golden-set eval — narration=${NARRATION_MODEL}, judge=${JUDGE_MODEL}`,
      // Default concurrency is 50 — two models × 27 cases at once risks Anthropic rate-limit
      // backoff (which looks like a silent hang: zero CPU, zero open connections, no logs).
      // 5 keeps this well under typical tier limits and keeps progress visible below.
      maxConcurrency: 5,
      task: async (item) => {
        const { bundle, submission } = item.input as TaskInput;
        const caseId = (item.metadata as CaseMetadata | undefined)?.caseId ?? '?';
        const decision = computeDecision(submission, bundle);
        const narrative = await generateNarrative(submission, bundle, decision, NARRATION_MODEL);
        completed += 1;
        console.log(`[${completed}/${GOLDEN_DATASET.length}] narrated ${caseId} -> ${decision.decision}`);
        return { decision, narrative } satisfies TaskOutput;
      },
      evaluators: [programmaticEvaluator, opusJudgeEvaluator],
      runEvaluators: [aggregateEvaluator],
    });

    console.log(await result.format());

    const consistencyRows = await runConsistencyCheck();

    await appendResultsMarkdown({
      runName: result.runName,
      datasetRunUrl: result.datasetRunUrl,
      narrationModel: NARRATION_MODEL,
      runEvaluations: result.runEvaluations,
      itemResults: result.itemResults.map((r) => ({
        caseId: (r.item.metadata as CaseMetadata | undefined)?.caseId ?? 'unknown',
        evaluations: r.evaluations,
      })),
      consistencyRows,
    });
  } finally {
    // Scores and spans are batched client-side — without an explicit flush, anything queued
    // when the process exits is silently lost.
    await langfuse.score.shutdown();
    await langfuseSpanProcessor.forceFlush();
    await langfuseSpanProcessor.shutdown();
  }
}

main().catch((err) => {
  console.error('Eval run failed:', err);
  process.exit(1);
});
