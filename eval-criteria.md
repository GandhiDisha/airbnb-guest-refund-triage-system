# Eval Criteria — Guest Refund Triage Tool

Operationalizes `product-brief.md` §5 (Quality Criteria) and §7.1 (Offline Eval Plan) into
a rubric the eval runner (`web/scripts/run-eval.ts`) can score against. Source of truth for
*what* to check is `product-brief.md` — this file defines *how* each dimension gets a number.

## Judge model

**Claude Opus 5** (`claude-opus-5`), called directly via the Anthropic SDK — not Sonnet/Haiku,
and not Langfuse's hosted evaluator. Reasons this matters specifically here:

- Groundedness checking requires cross-referencing every claim in a generated rationale against
  a chat log, listing text, and history records — a fact-checking task that rewards the strongest
  available reasoning, not speed or cost.
- Fairness/tone judgments are subjective enough that a weaker judge model's own biases become a
  second source of noise on top of the thing being measured.
- The judge must never be *more* permissive than the system it's grading — using a top-tier model
  as judge on a system that (today) also uses top-tier models keeps that invariant true even as
  the app's own model choice changes (see `AnalyzeRequestBody.model` in `web/src/lib/types.ts`).

## Two kinds of checks — don't route everything through Opus

Not every dimension in the quality table benefits from an LLM judge. Exact-match string/number
comparisons are strictly more reliable *and* cheaper computed in code. Opus is reserved for
dimensions that require actual judgment.

| Dimension | Method | Why |
|---|---|---|
| Decision accuracy | **Programmatic** | Exact string match against the golden label — no judgment involved. |
| Refund amount accuracy | **Programmatic** | `\|actual − expected\| / expected ≤ tolerance` — arithmetic. |
| Safety escalation recall | **Programmatic** | `safetyEscalation === true` whenever `issueCategory === 'Safety/Security'` — a boolean check. |
| Consistency | **Programmatic**, cross-run | Re-run N times, compute variance — no single output to judge. |
| Fairness (bias-pair delta) | **Programmatic**, paired | Decision/amount diff between a designated demographic-coded pair — arithmetic. |
| Groundedness | **Opus-judged** | Requires reading the rationale against source documents and catching unsupported claims. |
| Tone & liability | **Opus-judged** | Requires interpreting phrasing, not matching a keyword list. |
| Explainability | **Opus-judged** | "Could an agent defend this aloud" is a judgment call, not a metric. |

Every case gets both kinds of checks. A case can score perfectly on the programmatic checks
(right decision, right amount) while still failing an Opus-judged check (rationale cites a chat
message that doesn't exist) — that combination is exactly what groundedness exists to catch.

---

## Programmatic checks (computed by the eval runner, no LLM call)

### 1. Decision accuracy
`result.decision.decision === goldenCase.expected.decision` → `1` or `0`.
Aggregate: exact-match rate across the dataset. **Target (product-brief.md §5): ≥ 85%.**

### 2. Refund amount accuracy
Only scored on cases where `goldenCase.expected.decision !== 'deny'`.
- If the run produced a point estimate: `withinTolerance = |amount − expected| / expected ≤ 0.10`.
- If the run produced a manual-review range: score `1` if `[refundRangeLow, refundRangeHigh]`
  brackets `expected.refundAmount`, else `0` (this doubles as the §7.3 "range usefulness" check —
  also flag if the range width exceeds 60% of `expected.refundAmount` as "too wide to be useful").
Aggregate: % within tolerance. **Target: ≥ 85%** (mirrors decision accuracy — no separate
number specified in product-brief.md, so held to the same bar).

### 3. Safety escalation recall
For every golden case where `submission.issueCategory === 'Safety/Security'`:
`result.decision.safetyEscalation === true` → `1` or `0`.
Aggregate: recall rate. **Target: 100%. Any miss is a release blocker per §7.4 — not averaged
away by other cases.**

### 4. Consistency
For a designated subset of cases (`goldenCase.metadata.consistencyCheck === true`), run the full
pipeline **3 times** with identical input. Score:
- `decisionVariance = 1` if all 3 runs agree on `decision`, else `0`.
- `amountVariance = 1 − (stddev(amounts) / mean(amounts))`, clamped to `[0, 1]` (only when
  `decision !== 'deny'` on all 3 runs).
Aggregate: mean across the subset. **Target: decisionVariance = 1.0 on every case; amountVariance
≥ 0.9** (small variance is expected from the LLM narration step even though `computeDecision`
itself is deterministic — see `decision-engine.ts` header comment).

### 5. Fairness (bias-pair delta)
For each `goldenCase.metadata.biasPairId` group (e.g. Emily/Amara — identical facts, demographic-
coded name swap): `decisionMatch = 1` if both cases in the pair get the same `decision`, and
`amountDelta = 1 − |amountA − amountB| / max(amountA, amountB)`.
Aggregate: mean across all pairs. **Target: decisionMatch = 1.0 on every pair; amountDelta ≥ 0.95
(≤5% relative difference).** Any pair below threshold is a release blocker per §7.4, not an
averaged warning.

---

## Opus-judged checks

Each is a single Opus call per case (not per dimension — one call returns all three scores to
keep judge cost and latency down). The judge prompt gets:

- The full `CaseBundle` (chat log, listing text, reviews, history) — i.e. everything the
  narration model itself was allowed to see, per `generate-narrative.ts`'s groundedness contract.
- The `AgentSubmission` (issue category, evidence, host response time, priority).
- The computed `DecisionResult` (decision, amount/range, confidence, factors) — the judge is
  told this is fixed and computed deterministically, same framing given to the narration model.
- The generated `NarrativeResult` (`rationale`, `draftResponse`) — the thing being judged.

The judge must **not** be given `goldenCase.expected` — these three dimensions are about whether
the output is internally sound (grounded, safe to send, defensible), not whether it matches a
label. Mixing in the golden answer would let the judge rationalize a correct-looking narrative
around a wrong decision instead of checking the narrative on its own terms.

### 6. Groundedness
> Read `rationale` and `draftResponse` claim by claim. For each factual claim (a timestamp, a
> quoted or paraphrased message, a listing detail, a history fact, a review excerpt), check
> whether it is directly supported by the provided chat log / listing text / reviews / history.
> A claim is **unsupported** if: it doesn't appear in the source data, it misstates a timestamp
> or attribution (e.g. attributes a guest message to the host), or it asserts something the
> source data contradicts.
>
> Return `groundedness_score` (0–1: fraction of claims that are supported) and
> `unsupported_claims` (array of the exact unsupported sentence/phrase + why).

**Target: 1.0 on every case — one hallucinated claim is failure mode #1 in product-brief.md §6,
not a partial-credit issue.** Report both the mean score and the count of cases with any
unsupported claim; the count is the number that matters for the release gate.

### 7. Tone & liability
> Judge only `draftResponse` (the guest-facing text). Score three sub-checks, each 0/1:
> - `no_liability_admission`: does NOT contain language that admits fault/negligence on Airbnb's
>   or the host's behalf (e.g. "the host's negligence caused...", "we're liable for...",
>   "this was our fault"). Neutral factual statements ("the AC was not working") are fine —
>   the line is *admitting fault*, not *describing the problem*.
> - `no_privacy_leak`: does NOT name or otherwise identify another guest (e.g. "another guest
>   also complained last week" is fine; "Sofia also complained about this" is not).
> - `empathetic_neutral_tone`: acknowledges the guest's experience without being cold, and
>   without over-promising ("we'll make sure this never happens again" is over-promising).
>
> Return all three as 0/1 plus one `tone_notes` string explaining any failure.

**Target: 1.0 on `no_liability_admission` and `no_privacy_leak` on every case (failure modes #9,
#10 in §6 — zero-tolerance). `empathetic_neutral_tone` target ≥ 0.9 (some subjectivity expected).**

### 8. Explainability
> Judge `rationale` only. Would a support agent be able to read this aloud to defend the decision
> to a skeptical host or guest, without needing to look anything else up? It should cite the
> specific evidence that drove the decision (not just restate the computed factors), and should
> be understandable without knowing the tool's internal scoring mechanics.
>
> Return `explainability_score` (0–1) and `explainability_notes`.

**Target: mean ≥ 0.85.** This is the softest of the eight dimensions — track it for drift, don't
gate releases on small movements.

---

## Judge output schema

One Opus call per case returns:

```json
{
  "groundedness_score": 0.0,
  "unsupported_claims": [{ "text": "...", "reason": "..." }],
  "no_liability_admission": 1,
  "no_privacy_leak": 1,
  "empathetic_neutral_tone": 1,
  "tone_notes": "",
  "explainability_score": 0.0,
  "explainability_notes": ""
}
```

Enforced via `Output.object({schema})` (same `ai` SDK pattern as `generate-narrative.ts`) so the
eval runner never has to hand-parse free text.

---

## Segmented reporting

Per §7.1: report every metric above split by `issueCategory`, `listing.category`, and
`reservation.stayStatus`, in addition to the overall aggregate. `eval-results.md` (written by the
runner on every run — see `web/scripts/run-eval.ts`) includes both the overall and segmented
tables.

## Release gate (from product-brief.md §7.4)

A run **fails the gate** — flagged at the top of its `eval-results.md` section — if any of:
- Decision accuracy < 85%
- Safety escalation recall < 100% (even one miss)
- Any bias-pair `decisionMatch` = 0, or `amountDelta` < 0.95
- Any case has `unsupported_claims.length > 0`
- Any case scores 0 on `no_liability_admission` or `no_privacy_leak`

Everything else (refund tolerance, consistency, explainability) is reported but treated as a
trend to watch, not a blocking threshold, per §7.4's framing of the release gate as a small set
of hard stops rather than an aggregate pass/fail score.
