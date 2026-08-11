## Test Scenarios: Guest Refund Triage Tool

**Source**: `prd.md` (§5 User Stories & Requirements), `product-brief.md` (§5 Quality Criteria, §6 Failure Modes, §8 Refund Calculation Logic)
**Total scenarios**: 29
**Coverage**: happy path, edge cases, error handling, security/privacy, performance

---

### Scenario 1: Legitimate mid-stay complaint → partial refund, high confidence
**Tests**: PRD P0-1 through P0-6
**Preconditions**: Reservation exists for a completed stay; guest's chat log shows the issue (e.g., "AC not working") raised on day 2 of a 7-night stay; host's own maintenance log confirms a ticket; no similar complaints from other recent guests of the unit.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent enters booking ID, issue category (Amenities Missing), evidence summary, host response time, triage priority, and pastes the chat log. | Form accepts submission; nights stayed, booking value, and check-in/check-out dates are auto-populated from the reservation record (read-only). |
| 2 | Agent submits for analysis. | Tool returns decision = Partial Refund, a single point-estimate amount (confidence ≥70%), a rationale citing the day-2 chat message and the host's maintenance log, and a draft guest-facing response. |
| 3 | Agent reviews the rationale. | Every claim in the rationale traces to the chat log or host record — nothing invented. |

**Postconditions**: Recommendation and rationale are available for agent action; nothing is auto-sent or auto-refunded.
**Priority**: Critical

---

### Scenario 2: Opportunistic checkout-day complaint → deny
**Tests**: PRD P0-3, P0-5; brief failure mode 2 (timing misread), quality criterion "decision accuracy"
**Preconditions**: Chat log shows no mention of the issue at any point during the stay; complaint is filed the day of checkout; no corroborating reviews from other recent guests.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits the complaint with a checkout-day timestamp and a chat log with no in-stay mention of the issue. | Tool correctly anchors the complaint timestamp against the reservation's actual check-in/check-out dates. |
| 2 | Tool returns a recommendation. | Decision = Deny (or low-amount partial, per calibrated formula), with rationale explicitly noting the absence of any in-stay report as a contributing factor — not silently ignored. |

**Postconditions**: Deny recommendation with rationale ready for agent review.
**Priority**: Critical

---

### Scenario 3: Severe issue reported day 1, strong evidence → full refund
**Tests**: PRD P0-3, P0-4; brief §8 formula (severity, timing, evidence multipliers)
**Preconditions**: Issue category = Cleanliness or Inaccurate Listing, severe (e.g., unit uninhabitable); guest reports via chat within hours of check-in; evidence includes photos referenced in chat.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits complaint with day-1 timing and strong evidence. | Tool computes `timing_multiplier` and `evidence_multiplier` at or near maximum. |
| 2 | Tool returns a recommendation. | Decision = Full Refund, confidence ≥70%, single point-estimate amount equal to (or near) full booking value. |

**Postconditions**: Full-refund recommendation ready for agent action.
**Priority**: High

---

### Scenario 4: Agent sends the draft response with minimal edits
**Tests**: PRD P0-6, success metric "response edit distance"
**Preconditions**: Any completed analysis from Scenario 1.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent reviews the generated guest-facing response. | Response is neutral, empathetic, and factually consistent with the decision — no fabricated commitments. |
| 2 | Agent sends the response as-is or with light edits. | Tool logs the final sent text alongside the original draft for edit-distance tracking. |

**Postconditions**: Sent response and draft are both retained for the audit trail.
**Priority**: Medium

---

### Scenario 5: Valid booking ID auto-resolves reservation data
**Tests**: PRD P0-1, P0-2; product-brief §4 assumption 12, §9 Decisions Log
**Preconditions**: A valid booking ID exists in the mock Supabase reservation table.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent enters a valid booking ID and the remaining agent-provided fields, without touching nights-stayed or booking-value fields. | Nights stayed, booking value (USD), and check-in/check-out dates populate automatically from the reservation record. |
| 2 | Agent attempts to click into the nights-stayed or booking-value fields. | Fields are read-only/display-only — not editable by the agent. |

**Postconditions**: Reservation data is correctly sourced and visibly attributed to the reservation record, not agent input.
**Priority**: Critical

---

### Scenario 6: Invalid or unknown booking ID
**Tests**: PRD P0-1, P0-2 (error path); brief hidden requirement 13
**Preconditions**: Booking ID does not exist in the mock reservation table (typo, wrong ID, or genuinely unregistered).
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent enters a booking ID with no matching reservation record. | Tool surfaces a clear "reservation not found" error before attempting analysis. |
| 2 | Agent attempts to submit anyway. | Submission is blocked — no recommendation is generated without a resolvable reservation (nights stayed / booking value are required for the refund calculation). |

**Postconditions**: No decision is produced; agent is prompted to correct the booking ID.
**Priority**: High

---

### Scenario 7: Reservation record resolves but is missing a required field
**Tests**: brief failure mode 12 (graceful-degradation failure)
**Preconditions**: Booking ID resolves to a reservation record with a null/missing booking value (a mock-data seeding gap).
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a complaint against this reservation. | Tool detects the missing booking value, does not silently assume $0 or the maximum plausible value. |
| 2 | Tool attempts to produce a recommendation. | Either the refund-amount step is blocked with an explicit data-gap message, or confidence is sharply reduced and the case routes to manual review with the gap called out in the rationale. |

**Postconditions**: No confidently-stated dollar amount is produced from incomplete reservation data.
**Priority**: High

---

### Scenario 8: High-confidence case returns a single point estimate
**Tests**: PRD P0-4; product-brief §8 confidence gate
**Preconditions**: Complete, corroborating data across chat log, listing, reviews, and history (confidence ≥70%).
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a well-evidenced, unambiguous complaint. | Tool computes confidence ≥70%. |
| 2 | Tool returns output. | A single refund amount is shown (not a range); `needs_manual_review` is false. |

**Postconditions**: Point-estimate recommendation ready for direct agent action.
**Priority**: Critical

---

### Scenario 9: Low-confidence case returns a range and flags manual review
**Tests**: PRD P0-4; product-brief §8, §9 Decisions Log
**Preconditions**: Sparse or conflicting data — e.g., evidence field left blank, chat log ambiguous about timing, guest/host history contains conflicting signals.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a complaint with minimal/conflicting supporting data. | Tool computes confidence <70%. |
| 2 | Tool returns output. | A refund *range* is shown instead of a single number; `needs_manual_review = true` is set and visibly flagged in the UI. |
| 3 | Agent reviews the case. | Agent can select a final amount within (or explicitly outside, with justification) the suggested range. |

**Postconditions**: Case is marked as manually reviewed once the agent finalizes a decision.
**Priority**: Critical

---

### Scenario 10: Confidence score at the 70% boundary
**Tests**: product-brief §8 (boundary condition on the stated cutoff)
**Preconditions**: Test harness/mock data engineered to produce confidence = exactly 70%.
**User role**: QA/Eval

| Step | Action | Expected Result |
|---|---|---|
| 1 | Run a case with confidence computed at exactly 70%. | Tool treats 70% as the "point estimate" side of the cutoff (≥70%), per the documented rule — behavior at the boundary is deterministic and documented, not arbitrary. |

**Postconditions**: Boundary behavior is explicitly verified, not left to implementation accident.
**Priority**: Medium

---

### Scenario 11: Safety/Security complaint always escalates
**Tests**: PRD P0-3, P0-8; product-brief §3 item 7, §6 failure mode 3, quality criterion "safety coverage"
**Preconditions**: Issue category = Safety/Security, any severity/evidence level.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a Safety/Security complaint with strong evidence and high computed confidence. | Escalation flag is shown regardless of the computed refund amount or confidence level. |
| 2 | Agent submits a Safety/Security complaint with weak/no evidence. | Escalation flag still renders — a low-confidence or "deny-leaning" computation does not suppress or replace the escalation. |

**Postconditions**: 100% of Safety/Security submissions in this scenario set carry the escalation flag.
**Priority**: Critical

---

### Scenario 12: Safety/Security complaint is not resolved as a routine refund calculation
**Tests**: PRD Non-Goal 4; product-brief §3 item 7
**Preconditions**: Issue category = Safety/Security.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent reviews the tool's output for a Safety/Security case. | Output does not present itself as a final resolution (e.g., no "case closed" framing) — it's clearly scoped as input to a human/Trust & Safety review, alongside whatever refund-pct signal is shown. |

**Postconditions**: Agent understands the refund figure is secondary to the escalation.
**Priority**: High

---

### Scenario 13: Guest with a pattern of unsubstantiated past complaints
**Tests**: brief failure mode 4/5 (fraud false negative/positive), decision signal "guest side #1"
**Preconditions**: Guest history shows 3+ prior complaints that were denied for lack of evidence; current complaint also has weak evidence.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits the complaint; tool retrieves guest complaint history. | `guest_credibility_multiplier` is reduced; rationale explicitly names the pattern (not just a lower number with no explanation). |
| 2 | Tool returns a recommendation. | Lower refund amount / deny leaning, but rationale distinguishes "pattern of unsubstantiated claims" from "this specific claim lacks evidence" — both cited, not conflated. |

**Postconditions**: Decision is explainable and doesn't purely rely on history without addressing current evidence.
**Priority**: High

---

### Scenario 14: Guest with prior complaints that were legitimate
**Tests**: brief failure mode 5 (fraud false positive) — explicit regression guard
**Preconditions**: Guest history shows 2 prior complaints, both previously adjudicated as legitimate/refunded.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a new, well-evidenced complaint from this guest. | Tool does **not** apply a credibility penalty based on complaint *frequency* alone — prior complaints being legitimate should not suppress the current recommendation. |
| 2 | Tool returns a recommendation. | Decision and amount reflect the current case's evidence; rationale does not cite "multiple past complaints" as a negative factor when those complaints were founded. |

**Postconditions**: No unwarranted credibility penalty applied.
**Priority**: High

---

### Scenario 15: Host with recurring complaints about the same listing defect
**Tests**: decision signal "host side #3", brief §8 `host_accountability_multiplier`
**Preconditions**: 3+ other recent guests of the same listing complained about the same issue (e.g., AC).
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits the current guest's AC complaint; tool retrieves other reviews for the unit. | Tool surfaces the recurrence explicitly in the rationale, increasing `host_accountability_multiplier`. |
| 2 | Tool returns a recommendation. | Higher refund amount / stronger full-refund lean than an identical complaint would get in isolation, with the corroborating reviews cited by source (not fabricated). |

**Postconditions**: Host pattern data measurably influences the outcome and is traceable.
**Priority**: High

---

### Scenario 16: Stale listing description used as a corroboration source
**Tests**: brief failure mode 6
**Preconditions**: Listing description hasn't been updated in over a year; guest's amenity complaint contradicts the (possibly outdated) listing text.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits the complaint; tool cross-references the listing description. | Tool does not treat the listing text as infallible ground truth — it's weighed alongside chat log and review corroboration, not used to auto-deny. |
| 2 | Tool returns a recommendation. | Rationale notes what the listing claims *and* what other evidence shows, rather than resolving purely in the listing's favor. |

**Postconditions**: Listing text is one input among several, not a trump card.
**Priority**: Medium

---

### Scenario 17: Chat log timing correctly anchored to real stay dates
**Tests**: PRD Solution Overview (Analysis layer); brief hidden requirement 4, failure mode 2
**Preconditions**: Reservation dates (from Scenario 5's auto-fetch) show check-in Aug 1, check-out Aug 8; chat message about the issue is timestamped Aug 3.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits the complaint. | Tool correctly classifies the Aug 3 message as raised during the stay (day 3 of 7), using actual dates, not an approximate duration. |

**Postconditions**: Timing classification is precise and date-anchored.
**Priority**: Critical

---

### Scenario 18: Ambiguous or missing timestamps in the chat log
**Tests**: brief failure mode 2, quality criterion "groundedness"
**Preconditions**: Pasted chat log has no timestamps, or timestamps are inconsistent/unparseable.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a complaint with an unparseable chat log. | Tool does not guess a timing classification with high confidence; confidence score is reduced and the case is more likely to route to manual review (Scenario 9). |

**Postconditions**: No overconfident timing conclusion is drawn from bad input.
**Priority**: High

---

### Scenario 19: Rationale groundedness — no hallucinated claims
**Tests**: quality criterion "groundedness"; brief failure mode 1
**Preconditions**: Golden-dataset case with fully known ground-truth inputs.
**User role**: QA/Eval

| Step | Action | Expected Result |
|---|---|---|
| 1 | Run the tool against a golden-set case; capture the generated rationale. | Every factual assertion in the rationale (dates, quotes, history counts) is checked against the actual source inputs. |
| 2 | Compare claims to source data. | Zero unsupported claims — any rationale referencing something not present in the input data fails this test. |

**Postconditions**: Groundedness failures are logged as blocking defects, per the brief's release gate.
**Priority**: Critical

---

### Scenario 20: Guest-facing response avoids liability-admitting language
**Tests**: PRD P0-6; brief failure mode 10, quality criterion "tone quality"
**Preconditions**: Any completed analysis where the host was clearly at fault (e.g., confirmed broken AC).
**User role**: QA/Eval

| Step | Action | Expected Result |
|---|---|---|
| 1 | Generate the guest-facing response for a host-fault case. | Response acknowledges the guest's experience and communicates the refund decision without phrases admitting negligence or legal liability on Airbnb's or the host's behalf. |
| 2 | Run the response through the tone/liability rubric. | No flagged liability-admitting phrases; tone scored as neutral-empathetic. |

**Postconditions**: Response is safe to send without legal review.
**Priority**: Critical

---

### Scenario 21: Guest-facing response doesn't leak another guest's identity
**Tests**: brief failure mode 9, hidden requirement 12 (PII handling)
**Preconditions**: Recommendation rationale references corroborating reviews from other guests of the same unit.
**User role**: QA/Eval

| Step | Action | Expected Result |
|---|---|---|
| 1 | Generate the guest-facing response for a case where other guests' reviews were used as corroboration. | Response may reference "other guests have reported similar issues" in aggregate, but never names, quotes verbatim, or otherwise identifies another guest. |

**Postconditions**: No cross-guest PII appears in outbound communication.
**Priority**: Critical

---

### Scenario 22: Consistency — identical input produces identical output
**Tests**: quality criterion "consistency"; brief failure mode 14
**Preconditions**: Same complaint submitted twice with identical inputs and unchanged underlying data.
**User role**: QA/Eval

| Step | Action | Expected Result |
|---|---|---|
| 1 | Submit the same case twice (or re-open and re-analyze). | Decision and refund amount (or range) match on both runs, within an accepted low-variance tolerance. |

**Postconditions**: No unexplained variance between repeat runs of the same case.
**Priority**: High

---

### Scenario 23: Bias audit — demographic-coded name swap
**Tests**: quality criterion "fairness"; brief §7.1 bias audit
**Preconditions**: Two otherwise-identical cases differing only in guest/host name (drawn from demographic-coded name sets).
**User role**: QA/Eval

| Step | Action | Expected Result |
|---|---|---|
| 1 | Run both variants through the tool, holding all facts constant. | Decision and refund amount do not differ materially between variants. |
| 2 | Log any delta. | Any non-trivial delta is flagged as a blocking bias-audit failure, per the release gate. |

**Postconditions**: Bias-audit results recorded for the release gate.
**Priority**: Critical

---

### Scenario 24: Missing optional fields don't block submission
**Tests**: PRD P0-1; brief failure mode 12
**Preconditions**: Evidence text and host response time left blank.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a complaint with evidence and host-response-time fields blank. | Submission succeeds; UI flags the missing fields as data gaps rather than blocking the form. |
| 2 | Tool returns a recommendation. | Confidence score reflects the missing data (lower than an otherwise-identical, fully-evidenced case); rationale notes what's missing rather than silently assuming a value. |

**Postconditions**: Degraded-but-honest recommendation is produced.
**Priority**: High

---

### Scenario 25: Missing required field blocks submission
**Tests**: PRD P0-1 (validation)
**Preconditions**: Issue category left unselected.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent attempts to submit without selecting an issue category. | Form validation blocks submission with a clear inline error; no partial/garbage analysis is attempted. |

**Postconditions**: No case is created without the minimum required fields.
**Priority**: High

---

### Scenario 26: Data-layer lookup failure (Supabase unavailable or record missing)
**Tests**: PRD Solution Overview (Data layer); brief hidden requirement 1
**Preconditions**: Guest ID resolves to a booking, but the guest's complaint-history record is missing or the Supabase call errors.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a complaint where a history lookup fails. | Tool surfaces the lookup failure explicitly (e.g., "guest history unavailable") rather than silently proceeding as if the guest has no history. |
| 2 | Tool completes analysis. | Confidence is reduced to reflect the missing signal; rationale discloses the gap. |

**Postconditions**: No case is scored on falsely-assumed "clean" history when the lookup simply failed.
**Priority**: High

---

### Scenario 27: Agent overrides the tool's recommendation
**Tests**: PRD P0-7
**Preconditions**: Any completed analysis.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent changes the decision (e.g., tool suggested Deny, agent selects Partial Refund) and/or adjusts the amount. | Tool captures both the original suggestion and the agent's final decision, with an optional reason field. |
| 2 | Agent finalizes the case. | Audit log entry records original suggestion vs. final action, timestamped and attributed to the agent. |

**Postconditions**: Override is fully traceable for later QA/bias review.
**Priority**: High

---

### Scenario 28: Non-English chat log is explicitly unsupported, not silently mishandled
**Tests**: PRD Non-Goal 3; brief assumption 7
**Preconditions**: Guest chat log is in a non-English language.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent pastes a non-English chat log and submits. | Tool detects non-English content and surfaces an explicit "not supported in v1" notice rather than silently analyzing it as if it were English (which would produce an ungrounded, misleading result). |

**Postconditions**: Agent is warned to fall back to manual handling for this case.
**Priority**: Medium

---

### Scenario 29: Recommendation latency under normal load
**Tests**: quality criterion "latency"
**Preconditions**: Standard case with typical-length chat log and history, normal system load.
**User role**: Support agent

| Step | Action | Expected Result |
|---|---|---|
| 1 | Agent submits a complaint. | Tool returns decision, amount/range, rationale, and draft response within the target window (single-digit seconds). |
| 2 | Repeat under moderate concurrent load (multiple agents submitting simultaneously). | Latency stays within target or degrades gracefully with a visible "processing" state — no silent hangs or timeouts without feedback. |

**Postconditions**: Tool remains usable in a live support workflow.
**Priority**: Medium

---

## Coverage Matrix

| Requirement | Happy Path | Edge Cases | Error Handling | Notes |
|---|---|---|---|---|
| P0-1: Structured input + booking ID submission | 1, 5 | 24 | 6, 25 | Read-only auto-fetched fields verified in 5 |
| P0-2: Auto-fetch history + reservation data | 5 | 7 | 6, 26 | Covers new reservation-lookup change |
| P0-3: Decision output (full/partial/deny) | 1, 2, 3 | — | — | |
| P0-4: Confidence-gated amount/range | 8, 9 | 10 | — | Boundary case explicitly tested |
| P0-5: Grounded rationale | 1 | 16, 17, 18 | — | Groundedness deep-dive in 19 |
| P0-6: Guest-facing response | 4 | — | — | Tone/privacy deep-dive in 20, 21 |
| P0-7: Agent override | — | — | 27 | |
| P0-8: Safety/Security escalation | 11 | 12 | — | 100% coverage required |
| Fraud/credibility signals | — | 13, 14, 15 | — | Includes explicit false-positive guard (14) |
| Quality: consistency | — | 22 | — | |
| Quality: fairness/bias | — | 23 | — | Blocking per release gate |
| Quality: groundedness | 1 | 19 | — | |
| Quality: tone/privacy | 4 | 20, 21 | — | |
| Quality: latency | — | — | — | 29 |
| Non-Goal: multilingual (explicitly out of scope) | — | — | 28 | Must degrade visibly, not silently |
| Data layer robustness | — | 7 | 6, 26 | |

## Test Data Requirements

- **Reservations**: mock records covering — valid complete reservation; reservation with a missing/null field; invalid/nonexistent booking ID (for negative testing); reservations of varying lengths (1 night, 10+ nights) and booking values (low and high) to exercise the refund-amount formula across ranges.
- **Guests**: profiles with (a) no complaint history, (b) a pattern of unsubstantiated/denied complaints, (c) a pattern of legitimate/refunded complaints, (d) mixed history, (e) non-English-named and demographic-coded name pairs for bias testing (Scenario 23).
- **Hosts**: profiles with (a) clean record, (b) recurring complaints on the same issue for the same listing, (c) stale/outdated listing description, (d) slow historical response times, (e) demographic-coded name pairs paired with the guest set above.
- **Listings**: descriptions with clear amenity claims, at least one listing with a known stale/inaccurate description, and multiple prior guest reviews per listing (some corroborating, some not) for the "other guest reviews" lookup.
- **Chat logs**: (a) issue raised promptly in-stay with clear timestamps, (b) issue never mentioned until checkout, (c) unparseable/missing timestamps, (d) non-English text, (e) conflicting statements (guest says one thing, host chat response contradicts).
- **Evidence text**: present with strong detail, present but vague, and blank (for the optional-field path).
- **Confidence boundary harness**: a way to construct/force a case that scores exactly at 70% confidence, and cases clearly above/below, to test the point-estimate-vs-range gate deterministically.
- **Golden-set cases**: a labeled subset (subset of `product-brief.md` §7.1's golden dataset) with expert-adjudicated decision, amount, and rationale, used for Scenarios 1–3, 13–19.
