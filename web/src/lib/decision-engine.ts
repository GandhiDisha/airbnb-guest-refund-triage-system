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

// Safety/Security sits lower than its raw severity might suggest because it's already
// escalation-first (safetyEscalation always fires for this category, below) — the real
// consequence of a safety issue is Trust & Safety follow-up, not an outsized refund pct on
// top. product-brief.md §8 calls this out explicitly ("treated as escalation-first, not
// primarily a refund-pct case"); the golden dataset's "standard, clean" safety case
// (safety-1) targets the same 0.3 as a standard Amenities case, not a higher number.
const BASE_SEVERITY_PCT: Record<IssueCategory, number> = {
  'Safety/Security': 0.3,
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

// Word lists per category. Guests describe the THING that's wrong (the amenity, the room
// feature), not the category label — so these lean on common nouns/symptom phrases per
// category rather than just the abstract category vocabulary. Even so, this is fundamentally
// a finite list matched against open-ended natural language: eval-criteria.md's groundedness
// checks caught real misses here (e.g. "doesn't seem to work" not matching "doesn't work",
// "gym...closed" not matching any Amenities word). Expect residual misses on novel phrasing —
// see eval-results.md and the "Host Responsiveness" note below for why a keyword list alone
// won't fully close this gap.
const CATEGORY_KEYWORDS: Record<IssueCategory, string[]> = {
  'Amenities Missing': [
    'ac', 'air condition', 'wifi', 'heater', 'amenit',
    "doesn't work", "doesn't seem to work", 'not working', 'broken', 'out of order',
    "won't turn on", 'not functioning', 'unavailable', 'not available',
    'pool', 'gym', 'hot tub', 'jacuzzi', 'parking spot', 'elevator', 'dishwasher',
    'washer', 'dryer', 'fridge', 'refrigerat', 'microwave', 'fireplace',
  ],
  Cleanliness: [
    'dirty', 'clean', 'smell', 'dust', 'stain', 'bug',
    'hair', 'trash', 'garbage', 'mess', 'mold', 'grime', 'filthy', 'sticky',
  ],
  'Inaccurate Listing': [
    'listing', 'advertis', 'parking', 'photo', 'misrepresent', "isn't as", 'not as described',
    'describ', 'different from', 'smaller than', 'not what', 'not match', "doesn't match",
    'mislead', 'inaccurat', 'not accurate',
  ],
  'Safety/Security': [
    'lock', 'safety', 'security', 'unsafe', 'door', 'window', 'deadbolt',
    'smoke detector', 'carbon monoxide', 'alarm',
  ],
  // Guests reporting non-responsiveness usually describe the underlying issue (the thing they
  // messaged about), not the non-response itself — "the host has not been responsive" is the
  // exception, not the rule. A keyword list can't see the absence of a reply; that signal is
  // structural (hostResponseTimeHrs, whether any host message follows a guest message) and is
  // already used elsewhere in this file (computeEvidenceMultiplier's hostRepliedAfter check).
  // These keywords catch only the minority of cases where the guest says so explicitly.
  'Host Responsiveness': [
    'responsive', 'reply', 'response', 'waiting to hear', 'not heard back',
    'no response', 'no reply', 'never replied', 'never responded', 'unresponsive', "haven't heard",
  ],
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

// Phrases signaling "what I got doesn't match what I was told/shown" — deliberately about the
// *shape* of the complaint, not any specific amenity/feature, so this generalizes across
// listings instead of needing a new keyword added per feature type guests might mention.
const LISTING_MISMATCH_SIGNALS = [
  'thought i had', 'thought it had', 'thought there', 'was told', 'supposed to',
  'not what', 'different from', 'not as described', "isn't as", "doesn't match",
  'no such', "wasn't there", "isn't there", 'not included',
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'was', 'this', 'that', 'with', 'and', 'or', 'to', 'of', 'in', 'on',
  'for', 'it', 'room', 'one', 'have', 'has', 'just', 'here', 'there', 'your', 'you',
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

// Fallback for 'Inaccurate Listing' only, used when no CATEGORY_KEYWORDS hit: a guest message
// that (a) signals an expectation mismatch and (b) shares real vocabulary with THIS listing's
// own description is strong evidence of a listing complaint, regardless of which specific
// feature it's about — catches "I thought I had a private bathroom" against a listing whose
// description mentions "private ensuite bathroom" without needing "bathroom" in the keyword list.
function messageContradictsListing(text: string, listingDescription: string): boolean {
  const lower = text.toLowerCase();
  if (!LISTING_MISMATCH_SIGNALS.some((s) => lower.includes(s))) return false;
  const listingWords = significantWords(listingDescription);
  for (const word of significantWords(text)) {
    if (listingWords.has(word)) return true;
  }
  return false;
}

// Fallback for 'Host Responsiveness' only, used when no CATEGORY_KEYWORDS hit: guests reporting
// non-responsiveness usually describe the underlying issue, not the non-response itself (see
// CATEGORY_KEYWORDS comment above) — so the real signal is structural, not lexical. A guest
// message with no host reply anywhere after it is direct evidence of non-responsiveness. Gated
// on message length so a bare "here" / "leaving" check-in ping (used by several fixtures to
// represent a guest with nothing substantive on record) doesn't get treated as an unanswered
// request — those never expected a reply in the first place.
const SUBSTANTIVE_MESSAGE_MIN_LENGTH = 20;

function findUnansweredGuestMessage(messages: ChatMessage[]): ChatMessage | null {
  const sorted = [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    if (m.senderType !== 'guest') continue;
    if (m.messageText.trim().length < SUBSTANTIVE_MESSAGE_MIN_LENGTH) continue;
    if (!isMeaningfulComplaint(m.messageText)) continue;
    const hasReplyAfter = sorted.slice(i + 1).some((later) => later.senderType === 'host');
    if (!hasReplyAfter) return m;
  }
  return null;
}

function findMatchedGuestMessage(bundle: CaseBundle, category: IssueCategory): ChatMessage | null {
  const keywords = CATEGORY_KEYWORDS[category];
  const guestMessages = bundle.chatMessages
    .filter((m) => m.senderType === 'guest')
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  const keywordMatch = guestMessages.find((m) => messageMatchesCategory(m.messageText, keywords)) ?? null;
  if (keywordMatch) return keywordMatch;

  if (category === 'Inaccurate Listing') {
    return guestMessages.find((m) => messageContradictsListing(m.messageText, bundle.listing.description)) ?? null;
  }
  if (category === 'Host Responsiveness') {
    return findUnansweredGuestMessage(bundle.chatMessages);
  }
  return null;
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

// Phrases a host uses to explain away a reported issue as expected behavior or a non-defect,
// rather than acknowledging it — "that's normal", "cosmetic", "pre-existing". Distinct from
// LISTING_MISMATCH_SIGNALS: this is about the HOST's reply, not the guest's complaint, and it
// only fires on a message that already matched an issue category (matched === not null), so it
// can't turn an unrelated host chat line into a false deny. Checked against all 27 golden-set
// host replies before adding this list — none of the other cases' host messages ("I'll send a
// locksmith", "sending a cleaner today", etc.) contain any of these phrases.
const HOST_EXPLAINED_AWAY_SIGNALS = [
  'normal', 'not a malfunction', 'not broken', 'cosmetic', 'pre-existing', 'preexisting',
  'nothing wrong', 'no issue', 'not an issue', 'working as intended', 'not a problem',
  "isn't a problem", 'expected behavior', "supposed to do that",
];

function hostExplainedAwayIssue(bundle: CaseBundle, matched: ChatMessage | null): boolean {
  if (!matched) return false;
  return bundle.chatMessages.some(
    (m) =>
      m.senderType === 'host' &&
      new Date(m.sentAt) > new Date(matched.sentAt) &&
      HOST_EXPLAINED_AWAY_SIGNALS.some((s) => m.messageText.toLowerCase().includes(s)),
  );
}

// Signals a guest message describes an actual problem or ask, not a check-in/checkout
// pleasantry — length alone isn't a reliable filter here: several golden-set pleasantries
// ("Just checked in, all good, thanks!") clear 20 characters but carry no complaint. Used to
// gate which unanswered messages count as evidence in computeEvidenceMultiplier's Host
// Responsiveness branch below, so a "lame" message with no reply doesn't get treated the same
// as a real unanswered question.
const MEANINGFUL_COMPLAINT_SIGNALS = [
  '?', "isn't working", "wasn't working", 'not working', "doesn't work", 'broken', 'problem', 'issue',
  'waiting on', 'waiting for', 'still waiting', 'no response', 'no reply', 'never replied',
  'never responded', 'concerning', 'wondering', 'please', 'can you', 'could you',
  'when will', 'any update', 'let me know', 'stuck', 'locked out', "can't", 'cannot',
];

function isMeaningfulComplaint(text: string): boolean {
  // Golden-set chat text uses curly apostrophes (’) — normalize to straight (') so signals
  // like "isn't working" match "isn’t working" instead of silently never firing.
  const lower = text.toLowerCase().replace(/[’‘]/g, "'");
  return MEANINGFUL_COMPLAINT_SIGNALS.some((s) => lower.includes(s));
}

function computeEvidenceMultiplier(submission: AgentSubmission, bundle: CaseBundle, matched: ChatMessage | null): number {
  let score = 0.5;
  if (submission.evidenceOfClaim.trim().length > 20) score += 0.35;
  if (matched) {
    const hostRepliedAfter = bundle.chatMessages.some(
      (m) => m.senderType === 'host' && new Date(m.sentAt) > new Date(matched.sentAt),
    );
    if (hostExplainedAwayIssue(bundle, matched)) {
      score -= 0.35;
    } else if (submission.issueCategory === 'Host Responsiveness') {
      // Inverted from every other category: for Host Responsiveness, the ABSENCE of a host
      // reply is the evidence (that's the whole complaint), not its presence — but only when
      // the unanswered message was actually worth responding to.
      if (!hostRepliedAfter && isMeaningfulComplaint(matched.messageText)) score += 0.35;
    } else if (hostRepliedAfter) {
      score += 0.35;
    }
  }
  return Math.min(1.2, Math.max(0.3, score));
}

// evidence_multiplier's 1.2 ceiling × this = 1.0 exactly — a maximally-evidenced, promptly
// reported issue pays out exactly base_severity_pct, flat. Calibrated against 4 golden
// "textbook, clean, well-evidenced" cases (amenities-1, listing-1, cleanliness-1, bias-pair)
// that all require this same value to hit their expected amount exactly, regardless of which
// hour within the prompt (first-half-of-stay) window the report landed — a continuous
// day-fraction decay was double-penalizing reports later within that same window, on top of
// the discrete in_stay_prompt vs in_stay_late timing_multiplier tier that already exists.
const PROMPT_STAY_IMPACT_FRACTION = 5 / 6;

function computeStayImpactFraction(bucket: TimingBucket, bundle: CaseBundle, matched: ChatMessage | null): number {
  if (bucket === 'checkout_only') return 0.4;
  if (bucket === 'ambiguous') return 0.5;
  if (bucket === 'in_stay_prompt') return PROMPT_STAY_IMPACT_FRACTION;

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

const PHOTO_EVIDENCE_SIGNALS = ['photo', 'video', 'picture', 'screenshot'];

function hasPhotoOrVideoEvidence(evidenceOfClaim: string): boolean {
  const lower = evidenceOfClaim.toLowerCase();
  return PHOTO_EVIDENCE_SIGNALS.some((s) => lower.includes(s));
}

// True when the only accountability signal for this host/category is a public review from a
// DIFFERENT guest's past stay, with no formal same-issue complaint on this listing's own
// history (sameIssueOnListing === 0). A guest could construct or embellish a complaint by
// reading a past public review rather than offering genuine firsthand evidence of their own
// stay — that review is real corroboration of a *pattern*, but it's weaker support for THIS
// guest's specific claim than the platform's own recorded complaint history would be, and
// doesn't substitute for this guest's own evidence. Only matters when paired with the current
// guest's own evidence lacking any photo/video mention — if they have their own visual proof,
// the review-only provenance of the pattern signal doesn't matter.
function hasUnsubstantiatedReviewCorroboration(bundle: CaseBundle, category: IssueCategory, evidenceOfClaim: string): boolean {
  if (hasPhotoOrVideoEvidence(evidenceOfClaim)) return false;
  const sameIssueOnListing = bundle.hostHistory.filter(
    (c) => c.listingId === bundle.reservation.listingId && c.issueCategory === category,
  ).length;
  if (sameIssueOnListing > 0) return false;
  const keywords = CATEGORY_KEYWORDS[category];
  return bundle.otherReviews.some((r) => messageMatchesCategory(r.reviewText, keywords));
}

// Narrow on purpose: matches only explicit "this can't be independently confirmed" language
// about a host's counter-claim (e.g. "host claims prior notice was given by email, not
// verifiable in this chat log"), not general hedge words like "claims"/"vague"/"no detail" —
// those appear on several cases that already correctly deny via other paths (timing/evidence
// weakness), and a broader match risks tipping their confidence below the manual-review
// threshold and flipping a correct deny into partial_refund. Checked against all 27 golden
// evidenceOfClaim texts — only the one case this targets contains any of these phrases.
const UNVERIFIABLE_CLAIM_SIGNALS = [
  'not verifiable', 'unverifiable', "can't confirm", 'cannot confirm',
  'unable to verify', 'no way to verify', "can't verify", 'cannot verify',
];

function hasUnverifiableHostClaim(evidenceOfClaim: string): boolean {
  const lower = evidenceOfClaim.toLowerCase().replace(/[’‘]/g, "'");
  return UNVERIFIABLE_CLAIM_SIGNALS.some((s) => lower.includes(s));
}

function computeConfidence(
  submission: AgentSubmission,
  bucket: TimingBucket,
  nonEnglish: boolean,
  bundle: CaseBundle,
): number {
  let confidence = 95;
  if (submission.evidenceOfClaim.trim().length === 0) confidence -= 20;
  if (submission.hostResponseTimeHrs === null) confidence -= 15;
  if (bucket === 'ambiguous') confidence -= 25;
  if (hasUnverifiableHostClaim(submission.evidenceOfClaim)) confidence -= 30;
  if (hasUnsubstantiatedReviewCorroboration(bundle, submission.issueCategory, submission.evidenceOfClaim)) confidence -= 30;
  if (nonEnglish) confidence = Math.min(confidence, 40);
  return Math.min(97, Math.max(5, confidence));
}

const MANUAL_REVIEW_THRESHOLD = 70;
const DENY_THRESHOLD = 0.08;
const FULL_REFUND_THRESHOLD = 0.85;

export function computeDecision(submission: AgentSubmission, bundle: CaseBundle): DecisionResult {
  const category = submission.issueCategory;
  const matched = findMatchedGuestMessage(bundle, category);
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

  const confidence = computeConfidence(submission, timingBucket, nonEnglishChatDetected, bundle);
  const needsManualReview = confidence < MANUAL_REVIEW_THRESHOLD;
  const safetyEscalation = category === 'Safety/Security';

  // "Checkout-only, no evidence" is a confident deny signal on its own (failure mode 2 /
  // the Derek Miller / Ryan O'Connell pattern) even when overall confidence is middling.
  // Everything else that falls below the manual-review threshold is routed to a range
  // instead of committing to a confident deny/full-refund off of a low-confidence pct —
  // low confidence should never look like a confident denial (caught by testing WEI-330,
  // which was auto-denied off a near-zero pct computed from too-sparse data).
  const isWeakUnraisedClaim = timingBucket === 'checkout_only' && evidenceMultiplier < 0.65;
  // A reduced evidence multiplier alone isn't enough to flip in-stay, well-evidenced cases to
  // deny (the other factors keep refundPct above DENY_THRESHOLD) — so when the host directly
  // explained the issue away as expected/non-defective, that overrides the computed pct, the
  // same way isWeakUnraisedClaim already does for unraised checkout-only claims.
  const isExplainedAwayAsNonIssue = hostExplainedAwayIssue(bundle, matched);
  const decision = isWeakUnraisedClaim || isExplainedAwayAsNonIssue
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
