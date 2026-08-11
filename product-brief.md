# Product Brief: Guest Refund Triage Tool

Source: `problem-statement.md`

## 1. Problem Restatement

Support agents must triage post-/mid-stay guest complaints (AC broken, dirty unit, missing amenity, etc.) and decide: full refund, partial refund, or deny — fast, and defensibly. The same surface complaint ("AC didn't work") can be a genuine, evidenced, in-stay-reported issue; an unreported non-issue surfaced only at checkout; or an opportunistic claim. Getting it wrong in either direction has a cost: over-refund erodes host trust and revenue; under-refund erodes guest trust and retention. The tool is a decision-support system — it analyzes the complaint against corroborating signals and produces a recommended decision, refund amount, and a guest-facing response, for an agent to review and act on.

## 2. Stated Scope (from problem statement)

**Inputs (agent-provided):** issue category, evidence of claim, host response time, triage priority, plus a booking/reservation identifier.

**Auto-fetched (once the booking is identified):** stay status, listing category, nights stayed, booking value (USD), and the guest chat log — from the reservation, listing, and chat_messages records respectively. See §9 Decisions Log. None of these are typed in or pasted by the agent; only issue category (their classification), evidence of claim (their summary), host response time (their assessment), and triage priority remain genuinely agent-judgment fields.

**Outputs:** refund decision (give/not), refund amount if applicable, guest-facing response text.

**Decision signals called out explicitly:**
- Guest side: prior fake-complaint history, timing of complaint relative to stay stage, guest responsiveness, complaint frequency, whether guest informed the host during the stay.
- Host side: responsiveness, listing accuracy, complaint history, quality of complaint responses, listing thoroughness.

## 3. Hidden Requirements

These are capabilities the system needs in order to do what's asked, even though they aren't listed as explicit inputs or requirements.

1. **Historical data lookups, not just this-ticket data.** "Has this guest made fake complaints before," "how many complaints has this guest made," "has this host been complained about before" all require the tool to query guest/host history by ID — this is a data/integration dependency, not something the agent will type in each time. The Input list has no `guest_id` / `host_id` / `listing_id` field, but the analysis is impossible without one.
2. **Access to the listing description text**, to check "what the listing actually promises or disclaims" — not present in the Input list (`Category of Listing` is just an enum, not the actual listing copy).
3. **Access to other recent guests' review text for the same unit**, to check "does this specific issue recur" — also not in the Input list, and implies a retrieval step over review history, not a single flat input.
4. **Timestamp-level parsing of the chat log**, not just its presence — "did they raise it when it was happening or only after checkout" requires the tool to reason about *when in the stay* each message occurred relative to check-in/check-out dates, which means stay dates must exist somewhere in the data model even though only "no. of days in stay" (a duration) is listed as input.
5. **A refund policy / calculation logic.** Nothing in the problem statement specifies how booking value, nights, issue category, and severity combine into a refund percentage. Airbnb's real Rebooking and Refund Policy (AirCover) is itself not formulaic — it's explicitly case-by-case, based on "severity of the issue, the impact on the guest, the portion of the stay affected, whether the guest vacates, other mitigating factors, and the strength of evidence provided" (see §9 for the draft v1 logic this brief proposes, encoding those same factors as a scorable formula).
6. **Human-in-the-loop, not full automation.** The tool "suggests" — this implies the agent retains override authority and the system is not directly executing refunds or messaging guests, which in turn implies an approve/edit/reject step in the UI and an audit trail of what was suggested vs. what the agent actually did.
7. **A safety/escalation carve-out.** `Safety/Security` is one of five issue categories but is qualitatively different — it likely has legal/liability and duty-of-care implications that shouldn't be resolved by a refund-percentage calculation alone. The problem statement doesn't say this explicitly, but treating it identically to `Amenities Missing` is a real risk (see Failure Modes).
8. **Explainability / audit trail.** Because this affects real money and can be disputed by either party, the tool needs to produce not just a number but a traceable rationale ("guest raised this on day 2 via chat, host's own maintenance log confirms, no similar complaints from other guests") — otherwise agents can't defend the decision and it can't be audited later.
9. **Guest-facing response constraints.** "Neutral, diplomatic" implies the response must avoid admitting fault or liability on Airbnb's/host's behalf (legal exposure), avoid disclosing another guest's private review content, and avoid promising anything not backed by the actual decision.
10. **Consistency/determinism expectations.** Two near-identical complaints should get near-identical treatment — otherwise agents (and eventually guests/hosts, via word of mouth or appeals) will notice arbitrary variance, which undermines trust in the tool itself.
11. **Multi-language handling.** Guest chat logs on a global platform won't all be in English; nothing in the problem statement addresses this, but it's a real input-shape hidden requirement.
12. **PII/data privacy handling.** Chat logs, complaint history, and cross-referencing another guest's reviews all involve personal data that needs to be handled per privacy constraints (e.g., not surfacing one guest's identity/details to another).
13. **A booking/reservation identifier as an input.** Now that nights stayed, booking value, stay status, listing category, and the chat log are all auto-fetched rather than typed in (§9 Decisions Log), the agent needs to supply something that resolves to one specific reservation record (e.g., a booking ID, or guest_id + listing_id + stay date) — the tool can't infer which reservation to pull otherwise. Usefully, this also yields real check-in/check-out dates, which strengthens item 4 above: timing analysis can anchor to actual dates instead of just a duration.

## 4. Assumptions Made

Stated here explicitly so they can be validated or corrected — the brief below is written against these:

1. This is a **decision-support tool**, not an auto-execution system. The agent reviews and can override the suggestion before any refund is actually issued or message actually sent. No payment-rail integration is in scope for v1.
2. **`Evidence of Claim` is agent-entered free text/summary** (e.g., "guest sent photos of dirty bathroom, described in chat"), not a file-upload/image-analysis pipeline. No multimodal evidence processing (photo/video authenticity checking) is in scope for v1.
3. **Guest history, host history, listing descriptions, reservation records, and other guests' reviews are seeded as mock data in Supabase** for the prototype — these aren't manually pasted by the agent each time; they're looked up by ID (guest_id/host_id/listing_id/booking_id) once a complaint is opened. No live Airbnb data integration exists or is needed for v1.
4. **`Triage Priority`** is set upstream (by a routing/queueing system or a human) and is consumed by this tool as context (e.g., to decide how much escalation is warranted), not computed by it.
5. One complaint = one session/analysis. The tool doesn't need to handle a guest raising multiple unrelated issues in a single submission for v1.
6. Refund amount is bounded `[$0, booking value]` — no punitive amounts beyond what the guest paid.
7. **v1 is English-only by design decision** (not just a placeholder assumption) — guest chat logs are assumed English; non-English input handling is explicitly out of scope, not a fast-follow commitment yet.
8. **Safety/Security complaints always get a mandatory human-escalation flag** alongside any suggested decision — the tool should never present a refund-only recommendation as if it fully resolves a safety issue.
9. "Any tech stack can be used" is read as: this is a prototype/internal tool, not a production Airbnb system — so eval rigor matters more for building trust in the *approach* than for meeting a specific SLA.
10. **Output is a single point-estimate refund amount when model confidence ≥70%.** Below that threshold, the tool outputs a refund *range* instead of a point value, and the case is routed to a "needs manual review" state rather than presented as a ready-to-send recommendation.
11. **Confidence is computed from data completeness and corroboration strength** (e.g., missing evidence, no chat-log corroboration, conflicting signals between guest/host history all lower confidence) — the exact scoring function is a build-time detail, but the 70% cutoff is the fixed product decision.
12. **Nights stayed and booking value are read from the fetched reservation record, not typed in by the agent.** The agent supplies a booking/reservation identifier; the tool resolves it against the mock reservation table in Supabase and reads nights stayed, booking value, and check-in/check-out dates from there. These two fields become display-only in the UI, never editable inputs.
13. **Stay status, listing category, and the guest chat log are also auto-fetched off the same booking identifier, not agent-provided.** All three already exist as relational data once a reservation is resolved (`reservations.stay_status`, `listings.category`, `chat_messages` keyed by `reservation_id`) — there's no reason to make an agent re-select a status/category the system already knows, or paste a chat transcript that's already sitting in the platform's own messaging system. This mirrors the reasoning behind item 12 and further shrinks the agent-provided input set to genuinely agent-judgment fields only: issue category, evidence of claim, host response time, and triage priority.

## 5. Quality Criteria

| Dimension | What "good" looks like |
|---|---|
| **Decision accuracy** | Recommended decision (full/partial/deny) matches what a trained trust & safety expert would decide on the same case, at a target agreement rate (e.g., ≥85% exact match on a labeled eval set). |
| **Refund amount accuracy** | Suggested amount within a tight tolerance (e.g., ±10%) of expert-adjudicated amount on cases where a refund is warranted. |
| **Groundedness** | Every factual claim in the rationale and in the guest-facing response traces back to actual input data (chat log, listing text, review text, history) — zero fabricated details. |
| **Consistency** | Same or near-duplicate inputs produce the same decision and a low-variance refund amount across repeated runs. |
| **Fairness** | Decision and refund amount don't shift systematically when guest/host names or dialects are swapped across demographic-coded variants, holding facts constant. |
| **Tone quality** | Guest-facing response is empathetic but neutral, doesn't admit legal liability, doesn't over-promise, and doesn't leak another party's private information. |
| **Safety coverage** | 100% of Safety/Security-category complaints carry an explicit escalation flag regardless of computed refund amount. |
| **Explainability** | Every recommendation includes a rationale an agent could read aloud to a host or guest and defend. |
| **Latency** | Recommendation returned fast enough to fit into a live support workflow (target: single-digit seconds). |

## 6. Failure Modes

| # | Failure mode | Example | Why it matters |
|---|---|---|---|
| 1 | **Hallucinated evidence** | Rationale claims "guest mentioned this on day 1" when the chat log shows no such message. | Undermines trust; could be used to justify a wrong decision that's later disputed. |
| 2 | **Timing misread** | Complaint raised on checkout day is treated as if raised mid-stay because the tool doesn't correctly anchor chat timestamps to stay dates. | Core to the whole premise of the tool — this is the single most important signal described in the problem statement. |
| 3 | **Safety issue under-escalated** | A security complaint gets a calculated partial-refund answer with no escalation flag, as if it were a missing-amenity case. | Legal/liability exposure; duty-of-care failure. |
| 4 | **Fraud false negative** | Guest with a real pattern of prior fake complaints isn't flagged because history lookup silently fails or is incomplete, and the tool falls back to treating the claim at face value. | Hosts lose money/trust; the core "tell legitimate from opportunistic" job fails silently. |
| 5 | **Fraud false positive** | A guest with 2 prior *legitimate* complaints gets penalized for "complaint frequency" as if it were suspicious. | Punishes guests for having genuinely bad luck/experiences; damages guest retention, which the problem statement explicitly says matters. |
| 6 | **Stale/missing host or listing data treated as ground truth** | Listing description hasn't been updated in a year but is used to declare a guest's amenity complaint invalid. | Host-authored data isn't automatically accurate; over-trusting it biases against guests. |
| 7 | **Systematic bias toward "guest retention"** | The instruction to weigh guest satisfaction gets over-applied, producing a tool that grants refunds too easily and creates a moral hazard (frivolous claims get rewarded). | Explicitly one of the two failure directions called out in the problem statement. |
| 8 | **Systematic bias toward cost minimization** | Tool under-refunds to protect host revenue / Airbnb payout costs, causing legitimate guests to feel cheated. | The other explicit failure direction in the problem statement. |
| 9 | **Response leaks private information** | Guest-facing message references "another guest reported the same issue last week" in a way that identifies that guest. | Privacy violation. |
| 10 | **Response admits liability** | Generated text says something like "we're sorry the host's negligence caused this" — legally risky phrasing. | Creates legal exposure for Airbnb regardless of the refund decision itself. |
| 11 | **Category misclassification** | A complaint that's really a safety issue gets bucketed as "Cleanliness" because that's the more prominent keyword. | Routes the case through the wrong logic path entirely. |
| 12 | **Graceful-degradation failure** | Host response time or evidence field is missing/blank, and the tool silently assumes a value (best- or worst-case) instead of flagging the gap. | Produces a confident-sounding but under-informed recommendation. |
| 13 | **Non-English input mishandled** | Chat log in Portuguese is misread or ignored, producing a decision based on incomplete understanding. | Breaks the tool for a large share of real Airbnb traffic. |
| 14 | **Inconsistent repeat decisions** | Same case re-analyzed (e.g., agent reopens it) yields a different amount. | Erodes agent trust in the tool and is hard to defend if a guest/host appeals. |

## 7. Eval Plan

### 7.1 Offline eval (pre-launch, and regression-tested on every change)

- **Golden dataset.** Curate/construct labeled cases spanning: all 5 issue categories × all 3 listing categories × the legitimacy spectrum described in the problem statement (clearly legit + reported in-stay, clearly opportunistic + only at checkout, ambiguous/ordinary-use misunderstanding, repeat-offender guest, disputed-but-real edge cases). Each case gets an expert-adjudicated ground truth: decision, refund %, and a short rationale.
- **Decision accuracy:** exact-match rate against expert label on decision (full/partial/deny).
- **Refund amount error:** mean absolute error / % within tolerance band, on refund-warranted cases only.
- **Groundedness check:** for each generated rationale and guest response, verify every factual claim resolves to something present in the source inputs (chat log, listing text, reviews, history) — flag any unsupported claim.
- **Consistency check:** re-run identical and paraphrased-duplicate inputs N times; measure variance in decision and amount.
- **Bias audit:** swap guest/host names across demographic-coded name sets while holding all facts constant; measure decision/amount delta — target near-zero.
- **Safety escalation recall:** % of Safety/Security cases in the eval set that receive the escalation flag — target 100%.
- **Tone/liability scan:** run generated responses through a rubric (or classifier) checking for empathetic-but-neutral tone and absence of liability-admitting language.
- **Segmented breakdown:** report all of the above split by issue category, listing category, and stay status — a tool that's 90% accurate overall but fails badly on `Safety/Security` is not safe to ship.

### 7.2 Human-in-the-loop eval (pre-launch pilot)

- **Shadow mode:** run the tool alongside real agents on live (or replayed) tickets without acting on its output; compare agent's actual decision to the tool's suggestion and measure agreement rate.
- **Agent feedback loop:** capture thumbs-up/down + free-text reason per suggestion to build a qualitative failure taxonomy beyond the golden-set categories.
- **Edit-distance on responses:** how much do agents rewrite the generated guest message before sending — heavy edits signal tone/quality problems.

### 7.3 Online eval (post-launch)

- **Override rate:** % of cases where the agent overrides the tool's decision or amount — a leading indicator of trust/accuracy; watch for trend, not just a single number.
- **Guest CSAT** on refund-related interactions, before vs. after tool introduction.
- **Appeal/dispute rate** after a decision is communicated — should not increase vs. baseline.
- **Refund cost delta:** total $ refunded vs. historical baseline, to catch a systematic over- or under-refunding drift (the two failure directions the problem statement explicitly warns about).
- **Time-to-resolution** per ticket, before vs. after.
- **Retrospective fraud catch rate:** of complaints later confirmed fraudulent (e.g., via other investigation), what fraction did the tool flag at the time.

- **Confidence calibration:** bucket predictions by stated confidence (e.g., 60–70%, 70–80%, 90–100%) and check that actual accuracy in each bucket roughly matches the stated confidence — a "70% confidence" case should be right about 70% of the time. This validates the 70% manual-review cutoff itself, not just decisions above it.
- **Range usefulness:** for low-confidence cases, check the output range actually brackets the expert-adjudicated amount (range coverage), and isn't so wide it's useless to the agent.

### 7.4 Release gate (suggested)

Do not ship a decision-logic or prompt change past golden-set regression testing; do not exit shadow mode until agreement rate and safety-escalation recall both clear agreed thresholds; treat any bias-audit delta above a small threshold as a blocking issue, not a known-limitation.

## 8. Refund Calculation Logic (Draft v1)

No fixed refund formula exists in Airbnb's real-world policy to simply copy — their own Rebooking and Refund Policy is explicitly case-by-case. Per your call, we're defining our own, but grounded in the same factors Airbnb's actual policy names:

- **Severity of the issue** — its impact on habitability/safety, not just its category label.
- **Portion of the stay affected** — an issue reported day 1 of a 10-night stay is different from one reported the last night.
- **Whether the guest stayed or left** — not directly in our input list, but inferable: a same-day, first-24-hours complaint reads differently than one on checkout day.
- **Strength of evidence provided** — photos/video/chat corroboration vs. guest's word alone.
- **Mitigating/aggravating factors** — guest complaint history, host complaint history, whether the host was informed and how they responded.

**Proposed draft formula (v1, to validate against the golden dataset — not final):**

```
refund_pct = base_severity_pct(issue_category)
           × evidence_multiplier        # 0.5–1.2, from evidence strength + chat/host corroboration
           × timing_multiplier          # 1.0 if raised in-stay & promptly; 0.5–0.7 if only at/after checkout
           × stay_impact_fraction       # affected portion of the stay, based on when in the trip it was raised
           × guest_credibility_multiplier   # <1.0 if guest has a pattern of unsubstantiated past claims
           × host_accountability_multiplier # >1.0 if host has a pattern of the same complaint / poor responsiveness

refund_amount = clamp(refund_pct, 0, 1) × booking_value_usd
```

`booking_value_usd` and the stay's actual duration/dates are read from the fetched reservation record (§4 item 12), not agent-entered.

- `base_severity_pct` starting points by category (tune against golden set): Safety/Security → treated as escalation-first, not primarily a refund-pct case (see §3 item 7 / §6 failure mode 3); Inaccurate Listing → high; Amenities Missing → medium-high; Cleanliness → medium; Host Responsiveness → low-medium (usually a modifier on another issue, rarely standalone).
- **Confidence score** is computed alongside the amount from: evidence completeness, corroboration (chat log ↔ host records ↔ other reviews agreement), and how clean vs. conflicting the guest/host history signals are.
  - **≥70% confidence:** output the single `refund_amount`.
  - **<70% confidence:** output a range (e.g., `refund_pct ± uncertainty_band`) instead of a point value, and flag the case `needs_manual_review = true` — the agent decides within or outside the suggested range.
- This formula is a **starting hypothesis, not a policy** — §7.1's golden dataset and refund-amount-error metric exist specifically to calibrate `base_severity_pct` and the multipliers against expert judgment before this logic is trusted.

## 9. Decisions Log

Resolved during scoping — kept here for traceability rather than as open questions:

| Question | Decision |
|---|---|
| Where does guest/host/listing/review history live? | Mock data seeded in **Supabase** for the prototype; no live Airbnb data integration in v1. |
| Is there an existing refund formula to encode? | No — Airbnb's real policy is case-by-case, not formulaic. We're defining our own (§8), informed by the same factors Airbnb's policy names. |
| Single number or range output? | Single number by default; **range instead of a point value when confidence is below 70%**. |
| Do low-confidence cases get routed to manual review? | Yes — confidence <70% ⇒ `needs_manual_review = true` and a range is shown instead of a value. |
| Is multilingual chat log support in scope for v1? | No — v1 assumes English-only chat logs; non-English handling is explicitly out of scope, not committed as a fast-follow. |
| Are nights stayed and booking value agent-entered or system-fetched? | System-fetched — the agent supplies a booking/reservation identifier, and the tool reads nights stayed, booking value, and check-in/check-out dates from the matching reservation record in the mock Supabase data, rather than the agent typing them in. |
| Are stay status, listing category, and the guest chat log agent-entered or system-fetched? | System-fetched, same as nights/booking value — pulled from `reservations.stay_status`, `listings.category`, and `chat_messages` off the resolved booking ID. Decided during implementation once it was clear these already exist as relational data; the agent-provided input set is now just issue category, evidence of claim, host response time, and triage priority. |
