# Eval Results — Guest Refund Triage Tool

Appended to automatically by `web/scripts/eval/run-eval.ts` on every run. See `eval-criteria.md` for what each metric means and the release-gate thresholds.

---

## Run: guest-refund-triage-eval - 2026-08-14T00:47:08.644Z
- **Date:** 2026-08-14T00:55:41.209Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss7vne500yaad0dykp8kbqq/runs/790d66fd-560d-4dab-8909-d7e78c6db94f

### ❌ Release gate: FAILED

- Decision accuracy 44% < 85% target
- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 0.444 |
| agg_refund_amount_accuracy_rate | 0.125 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.803 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.481 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 0.00 | 0.00 | — | 0.64 | 1.00 | 1.00 | 0.50 | 0.15 |
| bias-pair-a | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.30 | 0.10 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.80 | 1.00 | 1.00 | 1.00 | 0.60 |
| responsiveness-4 | 0.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.40 |
| responsiveness-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 1.00 | 0.40 |
| responsiveness-2 | 1.00 | — | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.30 | 0.10 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| cleanliness-4 | 0.00 | — | — | 0.91 | 1.00 | 1.00 | 1.00 | 0.55 |
| cleanliness-3 | 0.00 | — | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.55 |
| cleanliness-2 | 0.00 | — | — | 0.88 | 1.00 | 1.00 | 1.00 | 0.65 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.88 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| listing-4 | 0.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.60 |
| listing-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.20 |
| listing-2 | 0.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.50 |
| listing-1 | 0.00 | 0.00 | — | 0.55 | 1.00 | 1.00 | 0.50 | 0.15 |
| amenities-5 | 0.00 | 0.00 | — | 0.55 | 1.00 | 1.00 | 0.50 | 0.15 |
| amenities-4 | 0.00 | — | — | 0.87 | 1.00 | 1.00 | 1.00 | 0.45 |
| amenities-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.20 |
| amenities-2 | 0.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.60 |
| amenities-1 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.60 | 0.80 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.75 | 1.00 | 1.00 | 1.00 | 0.25 |
| safety-4 | 1.00 | — | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.75 |
| safety-3 | 0.00 | — | 1.00 | 0.90 | 1.00 | 1.00 | 1.00 | 0.55 |
| safety-2 | 0.00 | — | 1.00 | 0.91 | 1.00 | 1.00 | 1.00 | 0.50 |
| safety-1 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.90 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | partial_refund, partial_refund, partial_refund | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T01:07:51.901Z
- **Date:** 2026-08-14T01:16:29.267Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/88895c2e-28f8-4cdd-992c-ad9bad29261d

### ❌ Release gate: FAILED

- Decision accuracy 74% < 85% target
- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 0.741 |
| agg_refund_amount_accuracy_rate | 0.125 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.800 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.554 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 0.00 | 0.00 | — | 0.50 | 1.00 | 1.00 | 0.00 | 0.10 |
| bias-pair-a | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.30 | 0.15 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.80 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-4 | 1.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| responsiveness-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.30 |
| responsiveness-2 | 1.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-1 | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.30 | 0.15 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| cleanliness-4 | 1.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| cleanliness-3 | 0.00 | — | — | 0.90 | 1.00 | 1.00 | 0.70 | 0.55 |
| cleanliness-2 | 1.00 | — | — | 0.92 | 1.00 | 1.00 | 0.50 | 0.75 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 0.80 | 0.80 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-4 | 1.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-3 | 1.00 | — | — | 0.55 | 1.00 | 1.00 | 0.50 | 0.15 |
| listing-2 | 1.00 | — | — | 0.90 | 1.00 | 1.00 | 0.50 | 0.75 |
| listing-1 | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.30 | 0.15 |
| amenities-5 | 0.00 | 0.00 | — | 0.55 | 1.00 | 1.00 | 0.50 | 0.15 |
| amenities-4 | 1.00 | — | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.20 |
| amenities-2 | 1.00 | — | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-1 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.70 | 0.85 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.77 | 1.00 | 1.00 | 1.00 | 0.25 |
| safety-4 | 1.00 | — | 1.00 | 0.92 | 1.00 | 1.00 | 0.50 | 0.70 |
| safety-3 | 0.00 | — | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.65 |
| safety-2 | 1.00 | — | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.75 |
| safety-1 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T01:46:43.167Z
- **Date:** 2026-08-14T01:55:37.277Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/0b0ba147-7c89-48b6-a6e9-ade1d74d38b3

### ❌ Release gate: FAILED

- Decision accuracy 74% < 85% target
- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 0.741 |
| agg_refund_amount_accuracy_rate | 0.125 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.799 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.584 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.40 | 0.20 |
| bias-pair-a | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.25 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.70 |
| responsiveness-4 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-3 | 1.00 | — | — | 0.75 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-2 | 1.00 | — | — | 0.78 | 1.00 | 1.00 | 0.80 | 0.65 |
| responsiveness-1 | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.40 | 0.25 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| cleanliness-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| cleanliness-3 | 0.00 | — | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.50 | 0.70 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 0.80 | 0.75 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.80 | 0.85 |
| listing-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.30 | 0.35 |
| listing-2 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 0.50 | 0.70 |
| listing-1 | 0.00 | 0.00 | — | 0.60 | 1.00 | 1.00 | 0.00 | 0.10 |
| amenities-5 | 0.00 | 0.00 | — | 0.65 | 1.00 | 1.00 | 0.50 | 0.20 |
| amenities-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.50 | 0.40 |
| amenities-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.80 | 0.70 |
| amenities-1 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.83 | 1.00 | 1.00 | 1.00 | 0.40 |
| safety-4 | 1.00 | — | 1.00 | 0.85 | 1.00 | 1.00 | 1.00 | 0.65 |
| safety-3 | 0.00 | — | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.55 |
| safety-2 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 1.00 | 0.72 |
| safety-1 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T02:38:33.916Z
- **Date:** 2026-08-14T02:46:32.285Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/dbe05521-d95e-45fd-9be6-a88ca4bc95fb

### ❌ Release gate: FAILED

- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 0.852 |
| agg_refund_amount_accuracy_rate | 0.125 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.838 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.646 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| bias-pair-a | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.89 | 1.00 | 1.00 | 1.00 | 0.70 |
| responsiveness-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-3 | 1.00 | — | — | 0.73 | 1.00 | 1.00 | 0.50 | 0.55 |
| responsiveness-2 | 1.00 | — | — | 0.88 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 0.00 | 0.00 | — | 0.65 | 1.00 | 1.00 | 0.40 | 0.20 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.91 | 1.00 | 1.00 | 1.00 | 0.80 |
| cleanliness-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-3 | 0.00 | — | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.55 |
| cleanliness-2 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 0.60 | 0.70 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.80 | 0.80 |
| listing-4 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.70 |
| listing-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.25 |
| listing-2 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.65 |
| listing-1 | 0.00 | 0.00 | — | 0.65 | 1.00 | 1.00 | 0.30 | 0.15 |
| amenities-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.35 |
| amenities-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.70 |
| amenities-1 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.90 |
| safety-4 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-3 | 0.00 | — | 1.00 | 0.90 | 1.00 | 1.00 | 1.00 | 0.45 |
| safety-2 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 0.50 | 0.70 |
| safety-1 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T06:13:24.505Z
- **Date:** 2026-08-14T06:21:16.457Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/a507f063-f10e-49cb-a052-1bd03d7c224c

### ❌ Release gate: FAILED

- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 0.926 |
| agg_refund_amount_accuracy_rate | 0.208 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.856 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.704 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| bias-pair-a | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-4 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.75 |
| responsiveness-3 | 1.00 | — | — | 0.73 | 1.00 | 1.00 | 0.50 | 0.55 |
| responsiveness-2 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 0.70 | 0.80 |
| cleanliness-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-3 | 0.00 | — | — | 0.91 | 1.00 | 1.00 | 1.00 | 0.55 |
| cleanliness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.50 | 0.70 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.80 | 0.85 |
| listing-4 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.70 |
| listing-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.35 |
| listing-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.65 |
| listing-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| amenities-5 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 0.80 | 0.75 |
| amenities-4 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.50 | 0.30 |
| amenities-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.70 |
| amenities-1 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.70 | 0.80 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| safety-4 | 1.00 | — | 1.00 | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-3 | 0.00 | — | 1.00 | 0.90 | 1.00 | 1.00 | 1.00 | 0.60 |
| safety-2 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 0.70 | 0.80 |
| safety-1 | 1.00 | 0.00 | 1.00 | 0.91 | 1.00 | 1.00 | 1.00 | 0.90 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T06:33:11.684Z
- **Date:** 2026-08-14T06:45:25.744Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/ad729d14-5b32-4ca2-bad8-5f83b1081e6c

### ❌ Release gate: FAILED

- 15 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 1.000 |
| agg_refund_amount_accuracy_rate | 0.208 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.848 |
| agg_groundedness_failure_count | 15.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.725 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 0.00 | — | 0.89 | 1.00 | 1.00 | 1.00 | 0.80 |
| bias-pair-a | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.60 |
| responsiveness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.72 |
| responsiveness-3 | 1.00 | — | — | 0.80 | 1.00 | 1.00 | 1.00 | 0.60 |
| responsiveness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-1 | 1.00 | 0.00 | — | — | — | — | — | — |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 0.80 | 0.80 |
| cleanliness-4 | 1.00 | — | — | — | — | — | — | — |
| cleanliness-3 | 1.00 | — | — | 0.77 | 1.00 | 1.00 | 0.50 | 0.75 |
| cleanliness-2 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 0.50 | 0.65 |
| cleanliness-1 | 1.00 | 1.00 | — | — | — | — | — | — |
| listing-5 | 1.00 | 0.00 | — | — | — | — | — | — |
| listing-4 | 1.00 | — | — | — | — | — | — | — |
| listing-3 | 1.00 | — | — | — | — | — | — | — |
| listing-2 | 1.00 | — | — | — | — | — | — | — |
| listing-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 0.70 | 0.85 |
| amenities-5 | 1.00 | 0.00 | — | — | — | — | — | — |
| amenities-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.80 | 0.80 |
| amenities-3 | 1.00 | — | — | — | — | — | — | — |
| amenities-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-1 | 1.00 | 0.00 | — | — | — | — | — | — |
| safety-5 | 1.00 | 0.00 | 1.00 | — | — | — | — | — |
| safety-4 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-3 | 1.00 | — | 1.00 | 0.75 | 1.00 | 1.00 | 0.50 | 0.60 |
| safety-2 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 0.50 | 0.65 |
| safety-1 | 1.00 | 0.00 | 1.00 | — | — | — | — | — |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T06:51:27.379Z
- **Date:** 2026-08-14T07:00:08.179Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/4e732ff4-0707-4b88-af2b-c18c08bf1758

### ❌ Release gate: FAILED

- 26 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 1.000 |
| agg_refund_amount_accuracy_rate | 0.208 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.852 |
| agg_groundedness_failure_count | 26.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.737 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.85 |
| bias-pair-a | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 0.80 | 0.80 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.70 |
| responsiveness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.70 |
| responsiveness-3 | 1.00 | — | — | 0.80 | 1.00 | 1.00 | 0.50 | 0.70 |
| responsiveness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.85 |
| cleanliness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-3 | 1.00 | — | — | 0.78 | 1.00 | 1.00 | 0.50 | 0.80 |
| cleanliness-2 | 1.00 | — | — | — | — | — | — | — |
| cleanliness-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 0.80 | 0.75 |
| listing-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.50 | 0.40 |
| listing-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-5 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 0.80 | 0.80 |
| amenities-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-3 | 1.00 | — | — | 0.67 | 1.00 | 1.00 | 0.50 | 0.40 |
| amenities-2 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.70 |
| amenities-1 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.85 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.93 | 1.00 | 1.00 | 1.00 | 0.85 |
| safety-4 | 1.00 | — | 1.00 | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-3 | 1.00 | — | 1.00 | 0.80 | 1.00 | 1.00 | 0.50 | 0.60 |
| safety-2 | 1.00 | — | 1.00 | 0.85 | 1.00 | 1.00 | 1.00 | 0.55 |
| safety-1 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.90 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $323, $323, $323 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $94.5, $94.5, $94.5 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T07:14:36.813Z
- **Date:** 2026-08-14T07:19:35.157Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/e10d1e43-859b-478d-8250-dadf2f146fdc

### ❌ Release gate: FAILED

- 18 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 1.000 |
| agg_refund_amount_accuracy_rate | 0.542 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.847 |
| agg_groundedness_failure_count | 18.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.717 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 0.90 | 0.80 |
| bias-pair-a | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.75 |
| responsiveness-3 | 1.00 | — | — | 0.75 | 1.00 | 1.00 | 0.80 | 0.55 |
| responsiveness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 1.00 | 0.00 | — | 0.88 | 1.00 | 1.00 | 0.80 | 0.80 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.85 |
| cleanliness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-3 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.50 | 0.80 |
| cleanliness-2 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.85 |
| listing-4 | 1.00 | — | — | 0.80 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.50 | 0.30 |
| listing-2 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.65 |
| listing-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 0.70 | 0.80 |
| amenities-5 | 1.00 | 0.00 | — | — | — | — | — | — |
| amenities-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-3 | 1.00 | — | — | — | — | — | — | — |
| amenities-2 | 1.00 | — | — | — | — | — | — | — |
| amenities-1 | 1.00 | 1.00 | — | — | — | — | — | — |
| safety-5 | 1.00 | 0.00 | 1.00 | — | — | — | — | — |
| safety-4 | 1.00 | — | 1.00 | — | — | — | — | — |
| safety-3 | 1.00 | — | 1.00 | — | — | — | — | — |
| safety-2 | 1.00 | — | 1.00 | — | — | — | — | — |
| safety-1 | 1.00 | 1.00 | 1.00 | — | — | — | — | — |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $204, $204, $204 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $105, $105, $105 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T07:29:46.335Z
- **Date:** 2026-08-14T07:37:54.023Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/83183568-af2d-403a-8535-9a03019c89bb

### ❌ Release gate: FAILED

- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 1.000 |
| agg_refund_amount_accuracy_rate | 0.625 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.854 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.715 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| bias-pair-a | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.65 |
| responsiveness-4 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.75 |
| responsiveness-3 | 1.00 | — | — | 0.75 | 1.00 | 1.00 | 0.80 | 0.50 |
| responsiveness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.75 |
| cleanliness-5 | 1.00 | 0.50 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.90 |
| cleanliness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.75 |
| cleanliness-3 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.80 | 0.80 |
| cleanliness-2 | 1.00 | — | — | 0.83 | 1.00 | 1.00 | 1.00 | 0.70 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| listing-5 | 1.00 | 0.00 | — | 0.91 | 1.00 | 1.00 | 1.00 | 0.85 |
| listing-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.50 | 0.80 |
| listing-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.50 | 0.35 |
| listing-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 0.90 | 0.75 |
| listing-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-5 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 0.80 | 0.75 |
| amenities-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| amenities-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.40 | 0.25 |
| amenities-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| safety-4 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 1.00 | 0.75 |
| safety-3 | 1.00 | — | 1.00 | 0.80 | 1.00 | 1.00 | 1.00 | 0.65 |
| safety-2 | 1.00 | — | 1.00 | 0.86 | 1.00 | 1.00 | 0.50 | 0.60 |
| safety-1 | 1.00 | 1.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $204, $204, $204 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $105, $105, $105 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |

---

## Run: guest-refund-triage-eval - 2026-08-14T07:51:10.362Z
- **Date:** 2026-08-14T08:04:57.774Z
- **Narration model under test:** claude-sonnet-5
- **Judge model:** claude-opus-5
- **Langfuse dataset run:** https://us.cloud.langfuse.com/project/cms5hw5ld0l6gad0i0p213wmx/datasets/cmss8z565012tad0ibehsjkvm/runs/baea48c9-59f6-4ae5-8e3d-1f74f1bf6721

### ❌ Release gate: FAILED

- 27 case(s) had unsupported claims (groundedness target: zero)

### Aggregate scores

| Metric | Value |
|---|---|
| agg_decision_accuracy_rate | 1.000 |
| agg_refund_amount_accuracy_rate | 0.667 |
| agg_safety_escalation_recall | 1.000 |
| agg_groundedness_mean | 0.842 |
| agg_groundedness_failure_count | 27.000 |
| agg_no_liability_admission_rate | 1.000 |
| agg_no_privacy_leak_rate | 1.000 |
| agg_explainability_mean | 0.710 |
| agg_bias_pair_dishwasher-pair_decision_match | 1.000 |
| agg_bias_pair_dishwasher-pair_amount_delta | 1.000 |

### Per-case scores

| Case | decision_accuracy | refund_amount_accuracy | safety_escalation_recall | groundedness | no_liability_admission | no_privacy_leak | empathetic_tone | explainability |
|---|---|---|---|---|---|---|---|---|
| bias-pair-b | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.85 |
| bias-pair-a | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.80 |
| responsiveness-5 | 1.00 | 0.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.70 |
| responsiveness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.72 |
| responsiveness-3 | 1.00 | — | — | 0.77 | 1.00 | 1.00 | 0.50 | 0.60 |
| responsiveness-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.55 |
| responsiveness-1 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 0.80 | 0.80 |
| cleanliness-5 | 1.00 | 1.00 | — | 0.82 | 1.00 | 1.00 | 0.50 | 0.75 |
| cleanliness-4 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 0.50 | 0.65 |
| cleanliness-3 | 1.00 | — | — | 0.75 | 1.00 | 1.00 | 0.80 | 0.80 |
| cleanliness-2 | 1.00 | — | — | 0.75 | 1.00 | 1.00 | 0.50 | 0.70 |
| cleanliness-1 | 1.00 | 1.00 | — | 0.90 | 1.00 | 1.00 | 1.00 | 0.85 |
| listing-5 | 1.00 | 0.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-4 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.80 |
| listing-3 | 1.00 | — | — | 0.60 | 1.00 | 1.00 | 0.40 | 0.30 |
| listing-2 | 1.00 | — | — | 0.82 | 1.00 | 1.00 | 1.00 | 0.65 |
| listing-1 | 1.00 | 1.00 | — | 0.91 | 1.00 | 1.00 | 1.00 | 0.85 |
| amenities-5 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 1.00 | 0.70 |
| amenities-4 | 1.00 | — | — | 0.84 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-3 | 1.00 | — | — | 0.65 | 1.00 | 1.00 | 0.50 | 0.35 |
| amenities-2 | 1.00 | — | — | 0.85 | 1.00 | 1.00 | 1.00 | 0.75 |
| amenities-1 | 1.00 | 1.00 | — | 0.92 | 1.00 | 1.00 | 0.80 | 0.85 |
| safety-5 | 1.00 | 0.00 | 1.00 | 0.91 | 1.00 | 1.00 | 1.00 | 0.80 |
| safety-4 | 1.00 | — | 1.00 | 0.85 | 1.00 | 1.00 | 1.00 | 0.70 |
| safety-3 | 1.00 | — | 1.00 | 0.80 | 1.00 | 1.00 | 0.50 | 0.55 |
| safety-2 | 1.00 | — | 1.00 | 0.85 | 1.00 | 1.00 | 0.50 | 0.65 |
| safety-1 | 1.00 | 1.00 | 1.00 | 0.92 | 1.00 | 1.00 | 1.00 | 0.90 |

### Consistency check (3 repeated runs per flagged case)

| Case | Decisions | Amounts | Decision variance | Amount variance |
|---|---|---|---|---|
| safety-1 | partial_refund, partial_refund, partial_refund | $204, $204, $204 | ✅ consistent | 100% |
| listing-5 | partial_refund, partial_refund, partial_refund | $105, $105, $105 | ✅ consistent | 100% |
| cleanliness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
| responsiveness-2 | deny, deny, deny | —, —, — | ✅ consistent | n/a |
