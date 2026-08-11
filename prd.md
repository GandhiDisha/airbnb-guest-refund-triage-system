## Product Requirements Document: Guest Refund Triage Tool

**Author**: Disha Gandhi
**Date**: 2026-08-08
**Status**: Draft
**Stakeholders**: Support Ops / Trust & Safety (primary consumer), Engineering (build), Product (owner)
**Source docs**: `problem-statement.md`, `product-brief.md` (same folder)

### 1. Executive Summary

Build a web tool that helps Airbnb support agents triage guest refund complaints. Given structured details about a stay and a guest's complaint, the tool analyzes corroborating signals — the in-stay chat log, the listing's own description, other guests' reviews of the same unit, and both parties' history — and returns a recommended decision (full refund / partial refund / deny), a refund amount (or a range when confidence is low), a plain-language rationale, and a draft neutral response the agent can send to the guest. The goal is faster, more consistent, more defensible refund decisions — without removing the agent from the loop and without systematically favoring either guest satisfaction or host revenue.

### 2. Background & Context

Airbnb support agents currently have to manually piece together whether a complaint ("the AC didn't work") is a genuine, promptly-reported issue or an opportunistic claim filed after a fine stay — by reading the chat thread, checking the listing, checking other guests' reviews, and checking the guest's own complaint history. Miscalibrating in either direction has a real cost: over-granting refunds erodes host trust and revenue; denying legitimate claims drives guest churn and bad reviews. This is a judgment-heavy, evidence-synthesis task today, done case by case with no tooling support.

Scoping work (see `product-brief.md`) surfaced that several capabilities the tool needs aren't in the problem statement's explicit input list — guest/host/listing/review history lookups, timestamp-level chat parsing, and a refund calculation formula, most notably. We also checked whether Airbnb's real-world Rebooking and Refund Policy (part of AirCover) could just be encoded directly: it can't, because it's explicitly case-by-case ("severity of the issue, impact on the guest, portion of the stay affected, whether the guest vacates, other mitigating factors, and strength of evidence provided," per Airbnb's help center), not a fixed formula. We're defining our own v1 formula using those same factors (`product-brief.md` §8), to be calibrated against a labeled golden dataset rather than trusted as-is.

### 3. Objectives & Success Metrics

**Goals**:
1. Give agents a refund decision, amount (or range), and rationale for a complaint in seconds, grounded in the actual evidence available (chat log, listing, reviews, history) — not just the complaint text.
2. Produce a guest-facing response agents can send with minimal editing.
3. Guarantee Safety/Security complaints are always flagged for human escalation, regardless of the computed refund amount.
4. Route low-confidence cases (<70%) to manual review with a range instead of a false-precision point estimate.
5. Keep decisions consistent and explainable enough that an agent (or a QA reviewer) can defend any given recommendation.

**Non-Goals**:
1. **Not a fully automated refund-execution system.** No payment-rail or refund-issuing integration in v1 — the agent reviews and acts; the tool only recommends.
2. **Not a multimodal evidence pipeline.** No photo/video upload or authenticity analysis in v1 — evidence is agent-entered text/summary.
3. **Not multilingual.** v1 assumes English-language chat logs; non-English handling is out of scope, not a committed fast-follow.
4. **Not a Safety/Security resolution engine.** Safety/Security complaints are always escalated to a human; the tool doesn't attempt to fully resolve them via a refund percentage alone.
5. **Not integrated with live Airbnb data.** v1 runs against mock guest/host/listing/review/complaint-history data seeded in Supabase — no production data integration.

**Success Metrics**:

| Metric | Current | Target | Measurement |
|---|---|---|---|
| Decision agreement with expert-adjudicated label | N/A (new capability) | ≥85% exact match | Offline eval against golden dataset (`product-brief.md` §7.1) |
| Refund amount accuracy | N/A | Within ±10% of expert-adjudicated amount, on refund-warranted cases | Offline eval, MAE / tolerance-band %|
| Safety/Security escalation recall | N/A | 100% | Offline eval, segmented by issue category |
| Groundedness (rationale/response) | N/A | Zero unsupported factual claims on golden set | Manual/rubric review of generated text vs. source inputs |
| Confidence calibration | N/A | Stated confidence within ~10pts of actual bucketed accuracy | Offline eval, confidence-bucketed accuracy |
| Agent override rate (post-pilot) | N/A | Declining trend across pilot; no fixed target pre-pilot | Shadow-mode / pilot logging |
| Response edit distance (post-pilot) | N/A | Low — most responses sendable with light edits | Shadow-mode / pilot logging |

### 4. Target Users & Segments

- **Primary user: Airbnb support agents** handling guest complaint/refund tickets. They need a fast, trustworthy second opinion with evidence already assembled, not a black-box answer.
- **Secondary/indirect: Trust & Safety team**, via the mandatory Safety/Security escalation path — they receive flagged cases, not general tickets.
- **Indirect beneficiaries (non-users of the tool itself): guests and hosts**, whose trust in the platform depends on decisions being consistent and defensible, even though they never interact with the tool directly.
- **QA/Product/Eval owner**: whoever curates the golden dataset, runs the offline eval suite, and calibrates the refund formula (`product-brief.md` §8) — not a day-to-day user, but a required role for this tool to be trustworthy.

### 5. User Stories & Requirements

**P0 — Must Have**:

| # | User Story | Acceptance Criteria |
|---|---|---|
| 1 | As a support agent, I can submit a complaint with the fields that require my judgment (issue category, evidence text, host response time, triage priority) plus a booking/reservation identifier, so the tool can analyze it. | Form captures the 4 agent-provided fields plus a booking identifier; optional/missing fields (e.g., evidence, host response time) are flagged but don't block submission; stay status, listing category, nights stayed, booking value, and the chat log are never manually-entered — they're resolved from the booking ID. |
| 2 | As a support agent, once I identify the guest/host/listing/booking, the tool automatically pulls relevant history and reservation details (guest complaint history, host complaint/accuracy history, listing description and category, other guests' reviews of the unit, the guest chat log, and the reservation record itself — stay status, nights stayed, booking value, check-in/check-out dates) so I don't have to gather, re-select, or paste any of it myself. | Data is retrieved from Supabase mock tables by guest_id/host_id/listing_id/booking_id; UI shows what was retrieved, with stay status, listing category, nights stayed, booking value, and the chat log all shown as read-only, sourced fields. |
| 3 | As a support agent, I receive a recommended decision (full refund / partial refund / deny). | Decision output matches one of the three defined states; Safety/Security cases always also carry an escalation flag regardless of decision. |
| 4 | As a support agent, I receive a refund amount when a refund is recommended — a single number if confidence ≥70%, or a range plus a "needs manual review" flag if confidence <70%. | Matches the confidence-gated output logic in `product-brief.md` §8; amount is bounded `[$0, booking value]`. |
| 5 | As a support agent, I see a rationale that cites specific evidence (e.g., chat timestamp vs. stay dates, listing text, matching/non-matching reviews, guest/host history) behind the recommendation. | Every factual claim in the rationale traces to an actual input/retrieved data point — no unsupported claims. |
| 6 | As a support agent, I receive a draft guest-facing response I can review and send. | Response is neutral/empathetic in tone, contains no liability-admitting language, and doesn't leak another guest's identity or private review content. |
| 7 | As a support agent, I can override the recommended decision and/or amount before taking action. | Override is captured (original suggestion + final agent decision + optional reason) for audit purposes. |
| 8 | As a support agent, when the issue category is Safety/Security, I see a clear, unmissable escalation indicator. | Escalation flag renders for 100% of Safety/Security submissions in testing, independent of computed refund amount. |

**P1 — Should Have**:

| # | User Story | Acceptance Criteria |
|---|---|---|
| 1 | As a support agent, I see a confidence score alongside the recommendation so I know how much to lean on it. | Confidence is shown as a number/band; <70% visibly ties to the "needs manual review" state. |
| 2 | As a support agent, I can see which factors most influenced the refund percentage (severity, evidence strength, timing, guest/host credibility) so I understand *why*, not just *what*. | UI surfaces the formula's contributing factors (`product-brief.md` §8) in plain language, not raw multipliers. |
| 3 | As a QA/product owner, I can run the tool against the golden evaluation dataset and get back the metrics defined in the Eval Plan (decision accuracy, amount error, groundedness, consistency, bias audit, safety recall, confidence calibration). | A repeatable eval run produces a report scoring all `product-brief.md` §7.1 metrics, segmented by issue category/listing category/stay status. |
| 4 | As a product/ops stakeholder, I can review a log of every suggestion vs. the agent's final action, for QA and bias auditing. | Audit log is queryable by case, agent, date range, and category. |

**P2 — Nice to Have / Future**:

| # | User Story | Acceptance Criteria |
|---|---|---|
| 1 | As a support agent, I can triage complaints with non-English chat logs. | Deferred — no acceptance criteria defined for v1. |
| 2 | As a support agent, I can submit photo/video evidence and have the tool assess it directly. | Deferred — multimodal evidence pipeline out of scope until prioritized. |
| 3 | As a support agent, an approved recommendation can trigger the actual refund without a separate manual step in another system. | Deferred — requires payment-rail integration, explicitly out of v1 scope. |
| 4 | As a product owner, I can watch a live shadow-mode dashboard comparing tool suggestions to real agent decisions in real time. | Deferred — post-pilot instrumentation. |

### 6. Solution Overview

- **Data layer**: Supabase, seeded with mock guest, host, listing, reservation, review, chat_messages, and complaint-history tables, keyed so a submitted complaint can be resolved to a guest_id/host_id/listing_id/booking_id and joined against history. The reservation table is the source of truth for stay status, nights stayed, booking value, and check-in/check-out dates; the listing table for category and description; the chat_messages table for the in-stay message thread — none of these are agent-entered.
- **Analysis layer**: parses the auto-fetched guest chat log against stay dates to determine *when* the issue was raised relative to the stay (the single most load-bearing signal per the problem statement); cross-references listing description text and other guests' reviews for corroboration; pulls guest and host history for credibility signals.
- **Decision layer**: implements the draft v1 refund formula (`product-brief.md` §8) — `base_severity_pct(issue_category) × evidence_multiplier × timing_multiplier × stay_impact_fraction × guest_credibility_multiplier × host_accountability_multiplier`, clamped to `[0, 1]` and applied to booking value. Safety/Security is treated as escalation-first rather than resolved purely through this formula. A confidence score (from data completeness + corroboration strength) gates whether the output is a single amount or a range + manual-review flag.
- **Generation layer**: produces (a) a rationale grounded in the specific retrieved evidence, and (b) a neutral, diplomatic guest-facing response — both required to pass groundedness and tone checks before being considered "done."
- **UI**: agent-facing web form for the 4 agent-judgment inputs plus a booking identifier, a results panel showing the auto-fetched reservation/chat/history context alongside the recommendation (decision, amount/range, rationale, draft response, confidence, escalation flag where applicable), and an override/edit step before the agent finalizes anything.
- **Audit trail**: every suggestion and the agent's eventual action are logged, both for individual case defensibility and for the bias/consistency audits in the Eval Plan.

### 7. Open Questions

| Question | Owner | Deadline |
|---|---|---|
| What's the actual confidence-scoring function (heuristic weighting vs. a trained/learned model) behind the 70% gate? | Eng | Before P0 build starts |
| What tech stack (LLM/provider, backend framework) implements the analysis and generation layers? | Eng | Before P0 build starts |
| Who curates and adjudicates the golden evaluation dataset used to calibrate `base_severity_pct` and the formula's multipliers? | Product/QA | Before offline eval can run |
| What are the starting `base_severity_pct` values per issue category, and who signs off on them before they're treated as the working policy? | Product | During P0 build |
| Is a shadow-mode pilot with real agents in scope for this project, or does it end at the offline-eval'd prototype stage? | Product | Before Phase 2 planning |

### 8. Timeline & Phasing

**Phase 1 — Core prototype (P0)**
Build the triage flow end-to-end on mock Supabase data: structured input form → history retrieval → draft-formula decision/amount (or range) → grounded rationale → guest-facing response → agent override. Stand up the golden dataset (v1, smaller set) and run the offline eval suite (`product-brief.md` §7.1) to sanity-check the formula and catch groundedness/safety-escalation failures before anything else is layered on.

**Phase 2 — Calibration & P1 features**
Expand the golden dataset, tune the refund formula's `base_severity_pct` and multipliers against eval results, add confidence-factor transparency and the audit log (P1 stories). Run the bias audit and consistency checks; treat failures here as blocking, per the brief's release gate.

**Phase 3 — Pilot (if scope extends beyond prototype)**
Shadow-mode pilot alongside real agents; track override rate, response edit-distance, and agreement rate; use findings to further calibrate before considering any move toward agent-facing production use.

**Phase 4 — Future (P2, not scheduled)**
Multilingual chat log support, multimodal evidence analysis, live data integration, and (if ever justified) direct refund-execution integration.
