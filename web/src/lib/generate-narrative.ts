// Generation layer — PRD §6. Takes the already-computed decision (decision-engine.ts)
// and narrates it: a rationale for the agent, and a draft neutral response for the guest.
// The model is explicitly told the decision is fixed and must not be re-derived, and is
// given only the facts it's allowed to cite — this is what keeps the output grounded
// (product-brief.md §5 "Groundedness") instead of the model inventing its own numbers
// or referencing facts that were never provided.

import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { config, DEFAULT_MODEL, MODEL_OPTIONS } from './config';
import type { AgentSubmission, CaseBundle, DecisionResult, ModelId, NarrativeResult } from './types';

const narrativeSchema = z.object({
  rationale: z
    .string()
    .describe('Internal, agent-facing explanation. Cite specific evidence by source (chat timestamp, listing text, review, history). No claims beyond the provided facts.'),
  draftResponse: z
    .string()
    .describe('Guest-facing message. Neutral, empathetic, no liability-admitting language, no mention of other guests by name or identifying detail.'),
});

function buildPrompt(submission: AgentSubmission, bundle: CaseBundle, decision: DecisionResult): string {
  const chatLog = bundle.chatMessages
    .map((m) => `[${m.sentAt}] ${m.senderType}: ${m.messageText}`)
    .join('\n');
  const reviews = bundle.otherReviews.map((r) => `- (${r.rating}/5) ${r.reviewText}`).join('\n') || 'none';
  const guestHistory =
    bundle.guestHistory.map((c) => `- ${c.filedAt}: ${c.issueCategory} -> ${c.decision}`).join('\n') || 'none';
  const hostHistory =
    bundle.hostHistory.map((c) => `- ${c.filedAt}: ${c.issueCategory} -> ${c.decision} (listing ${c.listingId})`).join('\n') ||
    'none';

  const amountLine =
    decision.decision === 'deny'
      ? 'No refund.'
      : decision.needsManualReview
        ? `Suggested range: $${decision.refundRangeLow} - $${decision.refundRangeHigh} (confidence ${decision.confidence}%, below the 70% threshold — flag as needing manual review, do not state a single dollar figure).`
        : `Refund amount: $${decision.refundAmount} (confidence ${decision.confidence}%).`;

  return `You are narrating an ALREADY-COMPUTED refund decision for an Airbnb support agent. Do not change or re-derive the decision, amount, or confidence — only explain it and draft a guest message, using ONLY the facts below.

DECISION (fixed, computed deterministically): ${decision.decision}
${amountLine}
Safety/Security escalation required: ${decision.safetyEscalation}
Timing classification: ${decision.factors.timingBucket}
Contributing factors: severity=${decision.factors.baseSeverityPct}, evidence=${decision.factors.evidenceMultiplier}, timing=${decision.factors.timingMultiplier}, stayImpact=${decision.factors.stayImpactFraction}, guestCredibility=${decision.factors.guestCredibilityMultiplier}, hostAccountability=${decision.factors.hostAccountabilityMultiplier}

CASE FACTS:
- Issue category: ${submission.issueCategory}
- Evidence provided by agent: ${submission.evidenceOfClaim || '(none provided)'}
- Host response time (agent-reported): ${submission.hostResponseTimeHrs ?? '(not provided)'} hours
- Stay: ${bundle.reservation.nightsStayed} nights, $${bundle.reservation.bookingValueUsd}, ${bundle.reservation.checkInDate} to ${bundle.reservation.checkOutDate}
- Listing: "${bundle.listing.title}" (${bundle.listing.category}) — description: "${bundle.listing.description}" (last updated ${bundle.listing.updatedAt})

CHAT LOG:
${chatLog || '(no messages)'}

OTHER GUEST REVIEWS OF THIS LISTING (aggregate only — never name these guests in the guest-facing response):
${reviews}

THIS GUEST'S PAST CASES:
${guestHistory}

THIS HOST'S PAST CASES (any listing):
${hostHistory}

Write:
1. rationale — for the agent's internal record, citing specific evidence above.
2. draftResponse — a short, neutral, empathetic message to send the guest, consistent with the decision, admitting no liability, naming no other guest.`;
}

function templatedFallback(submission: AgentSubmission, bundle: CaseBundle, decision: DecisionResult): NarrativeResult {
  const { factors } = decision;
  const timingText: Record<string, string> = {
    in_stay_prompt: 'raised promptly during the stay via chat',
    in_stay_late: 'raised during the stay, though later on',
    checkout_only: 'not raised during the stay — only surfaced after checkout',
    ambiguous: 'not clearly timed against the stay (sparse chat data)',
  };

  const rationale = [
    `Issue category: ${submission.issueCategory}. Timing: ${timingText[factors.timingBucket]}.`,
    factors.matchedGuestMessage
      ? `Matching guest message: "${factors.matchedGuestMessage.messageText}" (${factors.matchedGuestMessage.sentAt}).`
      : 'No chat message matched this issue category.',
    submission.evidenceOfClaim ? `Evidence provided: ${submission.evidenceOfClaim}` : 'No evidence text provided.',
    bundle.guestHistory.length > 0
      ? `Guest history: ${bundle.guestHistory.length} prior case(s), ${bundle.guestHistory.filter((c) => c.decision === 'deny').length} denied.`
      : 'No prior cases for this guest.',
    bundle.hostHistory.filter((c) => c.listingId === bundle.reservation.listingId && c.issueCategory === submission.issueCategory).length > 0
      ? `Host has ${bundle.hostHistory.filter((c) => c.listingId === bundle.reservation.listingId && c.issueCategory === submission.issueCategory).length} prior case(s) of the same issue on this listing.`
      : 'No prior same-issue cases found for this listing.',
    `Computed: severity=${factors.baseSeverityPct}, evidence=${factors.evidenceMultiplier}, timing=${factors.timingMultiplier}, stayImpact=${factors.stayImpactFraction}, guestCredibility=${factors.guestCredibilityMultiplier}, hostAccountability=${factors.hostAccountabilityMultiplier}, confidence=${decision.confidence}%.`,
    decision.safetyEscalation ? 'SAFETY/SECURITY — escalated to Trust & Safety regardless of the amount below.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const guestFirstName = bundle.guest.name.split(' ')[0];
  let draftResponse: string;
  if (decision.decision === 'deny') {
    draftResponse = `Hi ${guestFirstName}, thanks for reaching out. We reviewed your stay, including the in-stay messages, and weren't able to find evidence supporting the reported issue during your time at the property. We're not able to issue a refund for this stay, but please let us know if you have additional information you'd like us to review.`;
  } else if (decision.needsManualReview) {
    draftResponse = `Hi ${guestFirstName}, thank you for letting us know about this. We're still gathering a few more details on your stay before finalizing a refund amount, and an agent will follow up with you shortly.`;
  } else {
    draftResponse = `Hi ${guestFirstName}, thank you for letting us know about the issue during your stay. We've reviewed the details and are issuing a ${decision.decision === 'full_refund' ? 'full' : 'partial'} refund of $${decision.refundAmount} to reflect the impact on your stay. Thanks for your patience.`;
  }
  if (decision.safetyEscalation) {
    draftResponse += ` This has also been escalated to our safety team for direct follow-up.`;
  }

  return { rationale, draftResponse, usage: null };
}

function computeCostUsd(model: ModelId, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_OPTIONS.find((m) => m.id === model);
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M;
}

export async function generateNarrative(
  submission: AgentSubmission,
  bundle: CaseBundle,
  decision: DecisionResult,
  model: ModelId = DEFAULT_MODEL,
): Promise<NarrativeResult> {
  if (config.useMockLlm) {
    return templatedFallback(submission, bundle, decision);
  }

  const { output, usage } = await generateText({
    model: anthropic(model),
    output: Output.object({ schema: narrativeSchema }),
    prompt: buildPrompt(submission, bundle, decision),
  });

  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;

  return {
    ...output,
    usage: {
      model,
      inputTokens,
      outputTokens,
      costUsd: computeCostUsd(model, inputTokens, outputTokens),
    },
  };
}
