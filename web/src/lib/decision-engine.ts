// Deterministic refund decision engine — product-brief.md §8.
//
// Deliberately NOT an LLM call: the refund percentage is computed from structured
// signals (timing, evidence, history) so it's consistent and testable run-to-run
// (product-brief.md §5 "Consistency" quality criterion). The LLM (generate-narrative.ts)
// is only used afterward to narrate this already-computed decision in natural language —
// it never invents the number.
//
// This is a starting hypothesis to calibrate against a golden dataset (product-brief.md
// §7.1), not a trusted policy. Every constant below is a v1 guess.

import type {
  AgentSubmission,
  CaseBundle,
  ChatMessage,
  DecisionFactors,
  DecisionResult,
  IssueCategory,
  TimingBucket,
} from './types';

const BASE_SEVERITY_PCT: Record<IssueCategory, number> = {
  'Safety/Security': 0.5,
  'Inaccurate Listing': 0.35,
  'Amenities Missing': 0.3,
  Cleanliness: 0.25,
  'Host Responsiveness': 0.15,
};

const TIMING_MULTIPLIER: Record<TimingBucket, number> = {
  in_stay_prompt: 1.0,
  in_stay_late: 0.85,
  checkout_only: 0.5,
  ambiguous: 0.6,
};

const CATEGORY_KEYWORDS: Record<IssueCategory, string[]> = {
  'Amenities Missing': ['ac', 'air condition', 'wifi', 'heater', 'amenit', "doesn't work", 'not working', 'broken'],
  Cleanliness: ['dirty', 'clean', 'smell', 'dust', 'stain', 'bug'],
  'Inaccurate Listing': ['listing', 'advertis', 'parking', 'photo', 'misrepresent', "isn't as", 'not as described'],
  'Safety/Security': ['lock', 'safety', 'security', 'unsafe', 'door', 'window', 'deadbolt'],
  'Host Responsiveness': ['responsive', 'reply', 'response', 'waiting to hear', 'not heard back'],
};

const NON_ASCII_RATIO_THRESHOLD = 0.3;

function detectNonEnglish(messages: ChatMessage[]): boolean {
  const text = messages.map((m) => m.messageText).join(' ');
  if (text.length === 0) return false;
  const nonAscii = [...text].filter((ch) => ch.charCodeAt(0) > 127).length;
  return nonAscii / text.length > NON_ASCII_RATIO_THRESHOLD;
}

// Word-boundary matching — plain .includes() would match "ac" inside "place" or
// "space", producing a false-positive citation (caught by testing against EMILY-750,
// where it wrongly matched "just checked in, place looks great!"). Only a leading
// boundary is required (not trailing) so stems like "amenit" still match "amenities".
function messageMatchesCategory(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => new RegExp(`\\b${kw}`).test(lower));
}

function findMatchedGuestMessage(messages: ChatMessage[], category: IssueCategory): ChatMessage | null {
  const keywords = CATEGORY_KEYWORDS[category];
  const guestMessages = messages
    .filter((m) => m.senderType === 'guest')
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  return guestMessages.find((m) => messageMatchesCategory(m.messageText, keywords)) ?? null;
}

function classifyTiming(
  bundle: CaseBundle,
  matched: ChatMessage | null,
): TimingBucket {
  const { chatMessages, reservation } = bundle;
  const guestMessages = chatMessages.filter((m) => m.senderType === 'guest');

  if (chatMessages.length <= 1) return 'ambiguous';
  if (!matched) return guestMessages.length > 0 ? 'checkout_only' : 'ambiguous';

  const checkIn = new Date(reservation.checkInDate).getTime();
  const checkOut = new Date(reservation.checkOutDate).getTime();
  const matchedAt = new Date(matched.sentAt).getTime();
  const stayLengthMs = Math.max(checkOut - checkIn, 1);
  const dayFraction = (matchedAt - checkIn) / stayLengthMs;

  if (matchedAt >= checkOut) return 'checkout_only';
  return dayFraction <= 0.5 ? 'in_stay_prompt' : 'in_stay_late';
}

function computeEvidenceMultiplier(submission: AgentSubmission, bundle: CaseBundle, matched: ChatMessage | null): number {
  let score = 0.5;
  if (submission.evidenceOfClaim.trim().length > 20) score += 0.35;
  if (matched) {
    const hostRepliedAfter = bundle.chatMessages.some(
      (m) => m.senderType === 'host' && new Date(m.sentAt) > new Date(matched.sentAt),
    );
    if (hostRepliedAfter) score += 0.35;
  }
  return Math.min(1.2, Math.max(0.3, score));
}

function computeStayImpactFraction(bucket: TimingBucket, bundle: CaseBundle, matched: ChatMessage | null): number {
  if (bucket === 'checkout_only') return 0.4;
  if (bucket === 'ambiguous') return 0.5;

  const checkIn = new Date(bundle.reservation.checkInDate).getTime();
  const checkOut = new Date(bundle.reservation.checkOutDate).getTime();
  const stayLengthMs = Math.max(checkOut - checkIn, 1);
  const matchedAt = matched ? new Date(matched.sentAt).getTime() : checkIn;
  const dayFraction = (matchedAt - checkIn) / stayLengthMs;
  return Math.min(1, Math.max(0.3, 1 - dayFraction));
}

// Only unsubstantiated (denied) history lowers credibility — a guest's LEGITIMATE
// past complaints never count against them (product-brief.md failure mode 5 guard).
function computeGuestCredibilityMultiplier(bundle: CaseBundle): number {
  const denied = bundle.guestHistory.filter((c) => c.decision === 'deny').length;
  const granted = bundle.guestHistory.filter((c) => c.decision !== 'deny').length;
  if (denied >= 2 && granted === 0) return 0.6;
  if (denied >= 1 && granted === 0) return 0.8;
  return 1.0;
}

function computeHostAccountabilityMultiplier(bundle: CaseBundle, category: IssueCategory): number {
  const sameIssueOnListing = bundle.hostHistory.filter(
    (c) => c.listingId === bundle.reservation.listingId && c.issueCategory === category,
  ).length;
  const keywords = CATEGORY_KEYWORDS[category];
  const corroboratingReviews = bundle.otherReviews.filter((r) =>
    messageMatchesCategory(r.reviewText, keywords),
  ).length;
  const signal = sameIssueOnListing + corroboratingReviews;
  if (signal >= 2) return 1.3;
  if (signal === 1) return 1.15;
  return 1.0;
}

function computeConfidence(
  submission: AgentSubmission,
  bucket: TimingBucket,
  nonEnglish: boolean,
): number {
  let confidence = 95;
  if (submission.evidenceOfClaim.trim().length === 0) confidence -= 20;
  if (submission.hostResponseTimeHrs === null) confidence -= 15;
  if (bucket === 'ambiguous') confidence -= 25;
  if (nonEnglish) confidence = Math.min(confidence, 40);
  return Math.min(97, Math.max(5, confidence));
}

const MANUAL_REVIEW_THRESHOLD = 70;
const DENY_THRESHOLD = 0.08;
const FULL_REFUND_THRESHOLD = 0.85;

export function computeDecision(submission: AgentSubmission, bundle: CaseBundle): DecisionResult {
  const category = submission.issueCategory;
  const matched = findMatchedGuestMessage(bundle.chatMessages, category);
  const timingBucket = classifyTiming(bundle, matched);
  const nonEnglishChatDetected = detectNonEnglish(bundle.chatMessages);

  const baseSeverityPct = BASE_SEVERITY_PCT[category];
  const evidenceMultiplier = computeEvidenceMultiplier(submission, bundle, matched);
  const timingMultiplier = TIMING_MULTIPLIER[timingBucket];
  const stayImpactFraction = computeStayImpactFraction(timingBucket, bundle, matched);
  const guestCredibilityMultiplier = computeGuestCredibilityMultiplier(bundle);
  const hostAccountabilityMultiplier = computeHostAccountabilityMultiplier(bundle, category);

  const refundPct = Math.min(
    1,
    Math.max(
      0,
      baseSeverityPct *
        evidenceMultiplier *
        timingMultiplier *
        stayImpactFraction *
        guestCredibilityMultiplier *
        hostAccountabilityMultiplier,
    ),
  );

  const confidence = computeConfidence(submission, timingBucket, nonEnglishChatDetected);
  const needsManualReview = confidence < MANUAL_REVIEW_THRESHOLD;
  const safetyEscalation = category === 'Safety/Security';

  // "Checkout-only, no evidence" is a confident deny signal on its own (failure mode 2 /
  // the Derek Miller / Ryan O'Connell pattern) even when overall confidence is middling.
  // Everything else that falls below the manual-review threshold is routed to a range
  // instead of committing to a confident deny/full-refund off of a low-confidence pct —
  // low confidence should never look like a confident denial (caught by testing WEI-330,
  // which was auto-denied off a near-zero pct computed from too-sparse data).
  const isWeakUnraisedClaim = timingBucket === 'checkout_only' && evidenceMultiplier < 0.65;
  const decision = isWeakUnraisedClaim
    ? 'deny'
    : needsManualReview
      ? 'partial_refund'
      : refundPct < DENY_THRESHOLD
        ? 'deny'
        : refundPct >= FULL_REFUND_THRESHOLD
          ? 'full_refund'
          : 'partial_refund';

  const bookingValue = bundle.reservation.bookingValueUsd;
  let refundAmount: number | null = null;
  let refundRangeLow: number | null = null;
  let refundRangeHigh: number | null = null;

  if (decision !== 'deny') {
    if (needsManualReview) {
      refundRangeLow = Math.round(Math.max(0, refundPct * bookingValue * 0.7) * 100) / 100;
      refundRangeHigh = Math.round(Math.min(bookingValue, refundPct * bookingValue * 1.3) * 100) / 100;
    } else {
      refundAmount = Math.round(Math.min(bookingValue, refundPct * bookingValue) * 100) / 100;
    }
  }

  const factors: DecisionFactors = {
    baseSeverityPct,
    evidenceMultiplier,
    timingMultiplier,
    stayImpactFraction,
    guestCredibilityMultiplier,
    hostAccountabilityMultiplier,
    timingBucket,
    nonEnglishChatDetected,
    matchedGuestMessage: matched,
  };

  return {
    decision,
    refundAmount,
    refundRangeLow,
    refundRangeHigh,
    confidence,
    needsManualReview,
    safetyEscalation,
    factors,
  };
}
