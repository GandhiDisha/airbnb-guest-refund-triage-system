// Golden eval dataset — product-brief.md §7.1 "Curate/construct labeled cases spanning: all 5
// issue categories × all 3 listing categories × the legitimacy spectrum."
//
// Coverage: a full 5 (issue category) × 5 (legitimacy point) grid = 25 cases, with listing
// category rotated across each category's 5 cases so all 3 listing types also appear per
// category. This is deliberately NOT the full 5×3×5=75 factorial — that many hand-adjudicated
// cases isn't maintainable — but every category×legitimacy cell and every category×listing-type
// pair is covered at least once. Plus 2 cases forming a bias-audit pair (see eval-criteria.md
// §"Fairness") and 3 cases flagged for the consistency check (repeated-run variance).
//
// `expected` is independent human/expert adjudication, NOT derived from decision-engine.ts's
// formula — matching the tool's own arithmetic here would make the eval circular and unable to
// catch a systematically-wrong formula. See eval-criteria.md for how each field is scored.

import type { AgentSubmission, CaseBundle, IssueCategory, ListingCategory, RefundDecision } from '../../src/lib/types.ts';

export type LegitimacyPoint =
  | 'clearly-legit-instay'
  | 'opportunistic-checkout-only'
  | 'ambiguous-misunderstanding'
  | 'repeat-offender'
  | 'disputed-edge-case';

export interface GoldenCaseExpected {
  decision: RefundDecision;
  refundAmount: number | null;
  refundRangeLow?: number;
  refundRangeHigh?: number;
  rationale: string; // human-adjudicated justification, for review — not scored directly
}

export interface GoldenCase {
  id: string;
  bundle: CaseBundle;
  submission: AgentSubmission;
  expected: GoldenCaseExpected;
  metadata: {
    issueCategory: IssueCategory;
    listingCategory: ListingCategory;
    legitimacyPoint: LegitimacyPoint;
    consistencyCheck?: boolean;
    biasPairId?: string;
  };
}

export const GOLDEN_DATASET: GoldenCase[] = [
  // ============================================================================
  // SAFETY/SECURITY — safetyEscalation must be true on every case in this category
  // regardless of decision (product-brief.md failure mode #3).
  // ============================================================================
  {
    id: 'safety-1',
    metadata: { issueCategory: 'Safety/Security', listingCategory: 'Entire Property', legitimacyPoint: 'clearly-legit-instay', consistencyCheck: true },
    bundle: {
      reservation: { id: 'res-eval-safety-1', listingId: 'listing-eval-hillside-villa', guestId: 'guest-eval-maya-torres', hostId: 'host-eval-grace-liu', checkInDate: '2026-03-10', checkOutDate: '2026-03-14', nightsStayed: 4, bookingValueUsd: 680, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-maya-torres', name: 'Maya Torres' },
      host: { id: 'host-eval-grace-liu', name: 'Grace Liu' },
      listing: { id: 'listing-eval-hillside-villa', category: 'Entire Property', title: 'Hillside Villa', description: 'Spacious 3-bedroom villa with private entrance and secure keypad lock.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hi, just checked in — heads up, the front door deadbolt seems broken, it doesn’t latch.', sentAt: '2026-03-10T20:00:00Z' },
        { senderType: 'host', messageText: 'Oh no, so sorry — I’ll send a locksmith out first thing tomorrow.', sentAt: '2026-03-11T10:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-safety-1', issueCategory: 'Safety/Security', evidenceOfClaim: 'Guest sent a photo of the broken deadbolt the night they arrived.', hostResponseTimeHrs: 14, triagePriority: 'High' },
    expected: { decision: 'partial_refund', refundAmount: 204, rationale: 'Prompt, clear, photo-evidenced safety report; host was slow (14h) but ultimately resolved it. Standard partial for a real, promptly-reported safety gap.' },
  },
  {
    id: 'safety-2',
    metadata: { issueCategory: 'Safety/Security', listingCategory: 'Shared Room', legitimacyPoint: 'opportunistic-checkout-only' },
    bundle: {
      reservation: { id: 'res-eval-safety-2', listingId: 'listing-eval-downtown-shared', guestId: 'guest-eval-jordan-blake', hostId: 'host-eval-daniel-reyes', checkInDate: '2026-04-02', checkOutDate: '2026-04-05', nightsStayed: 3, bookingValueUsd: 240, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-jordan-blake', name: 'Jordan Blake' },
      host: { id: 'host-eval-daniel-reyes', name: 'Daniel Reyes' },
      listing: { id: 'listing-eval-downtown-shared', category: 'Shared Room', title: 'Downtown Shared Suite', description: 'Shared suite in a converted loft, walk to transit.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Just checked in, all good, thanks!', sentAt: '2026-04-02T15:00:00Z' },
        { senderType: 'guest', messageText: 'Checking out now, thanks!', sentAt: '2026-04-05T09:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-safety-2', issueCategory: 'Safety/Security', evidenceOfClaim: '', hostResponseTimeHrs: null, triagePriority: 'Medium' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Only in-stay message says everything was fine; safety claim surfaces for the first time after checkout with zero evidence. Deny the refund, but escalation flag must still be true — this category escalates by category, not by claim credibility.' },
  },
  {
    id: 'safety-3',
    metadata: { issueCategory: 'Safety/Security', listingCategory: 'Private Room', legitimacyPoint: 'ambiguous-misunderstanding' },
    bundle: {
      reservation: { id: 'res-eval-safety-3', listingId: 'listing-eval-garden-private', guestId: 'guest-eval-tobias-klein', hostId: 'host-eval-patricia-nguyen', checkInDate: '2026-02-20', checkOutDate: '2026-02-23', nightsStayed: 3, bookingValueUsd: 300, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-tobias-klein', name: 'Tobias Klein' },
      host: { id: 'host-eval-patricia-nguyen', name: 'Patricia Nguyen' },
      listing: { id: 'listing-eval-garden-private', category: 'Private Room', title: 'Garden Private Room', description: 'Private room with garden access, electronic keypad entry.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'The keypad is asking me to re-enter the code every night, is it malfunctioning? Feels like a security issue.', sentAt: '2026-02-20T19:00:00Z' },
        { senderType: 'host', messageText: 'That’s normal — it resets nightly for security. Not a malfunction!', sentAt: '2026-02-20T20:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-safety-3', issueCategory: 'Safety/Security', evidenceOfClaim: 'Guest describes keypad requiring re-entry each night, thought it was a malfunction.', hostResponseTimeHrs: 1, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Explained same-day as expected behavior, not an actual defect — no refund warranted. Escalation flag still true (category-based).' },
  },
  {
    id: 'safety-4',
    metadata: { issueCategory: 'Safety/Security', listingCategory: 'Entire Property', legitimacyPoint: 'repeat-offender' },
    bundle: {
      reservation: { id: 'res-eval-safety-4', listingId: 'listing-eval-lakeside-cottage', guestId: 'guest-eval-connor-walsh', hostId: 'host-eval-simon-okoro', checkInDate: '2026-05-05', checkOutDate: '2026-05-08', nightsStayed: 3, bookingValueUsd: 450, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-connor-walsh', name: 'Connor Walsh' },
      host: { id: 'host-eval-simon-okoro', name: 'Simon Okoro' },
      listing: { id: 'listing-eval-lakeside-cottage', category: 'Entire Property', title: 'Lakeside Cottage', description: 'Cozy lakeside cottage with smoke and CO detectors.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'here', sentAt: '2026-05-05T16:00:00Z' },
        { senderType: 'guest', messageText: 'leaving', sentAt: '2026-05-08T10:00:00Z' },
      ],
      otherReviews: [],
      guestHistory: [
        { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2025-12-01', listingId: 'listing-eval-other-1' },
        { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2026-01-15', listingId: 'listing-eval-other-2' },
      ],
      hostHistory: [],
    },
    submission: { bookingId: 'res-eval-safety-4', issueCategory: 'Safety/Security', evidenceOfClaim: '', hostResponseTimeHrs: null, triagePriority: 'High' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Checkout-only claim, no evidence, guest has 2 prior denied/unsubstantiated complaints. Deny; escalation flag still true regardless (category-based, not a function of credibility).' },
  },
  {
    id: 'safety-5',
    metadata: { issueCategory: 'Safety/Security', listingCategory: 'Shared Room', legitimacyPoint: 'disputed-edge-case' },
    bundle: {
      reservation: { id: 'res-eval-safety-5', listingId: 'listing-eval-artist-loft', guestId: 'guest-eval-yuki-tanaka', hostId: 'host-eval-renata-silva', checkInDate: '2026-06-01', checkOutDate: '2026-06-04', nightsStayed: 3, bookingValueUsd: 330, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-yuki-tanaka', name: 'Yuki Tanaka' },
      host: { id: 'host-eval-renata-silva', name: 'Renata Silva' },
      listing: { id: 'listing-eval-artist-loft', category: 'Shared Room', title: 'Artist Loft Shared Room', description: 'Shared room in an artist loft, smoke detector in common area.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Arrived, room’s nice!', sentAt: '2026-06-01T14:00:00Z' },
        { senderType: 'guest', messageText: 'Wait, I just noticed the smoke detector has no battery in it — kind of concerning.', sentAt: '2026-06-02T11:00:00Z' },
        { senderType: 'host', messageText: 'Oh no, I’ll swap the battery today, thanks for the heads up.', sentAt: '2026-06-02T14:00:00Z' },
        { senderType: 'guest', messageText: 'Thanks, all good now.', sentAt: '2026-06-03T09:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-safety-5', issueCategory: 'Safety/Security', evidenceOfClaim: 'Guest noted missing smoke detector battery day 2; host fixed it same day.', hostResponseTimeHrs: 3, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: null, refundRangeLow: 30, refundRangeHigh: 70, rationale: 'Real, promptly-reported and same-day-resolved safety gap, but host disputes severity (low-battery chirp vs fully missing battery) — genuinely disputed magnitude, route to manual review.' },
  },

  // ============================================================================
  // AMENITIES MISSING
  // ============================================================================
  {
    id: 'amenities-1',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Private Room', legitimacyPoint: 'clearly-legit-instay' },
    bundle: {
      reservation: { id: 'res-eval-amenities-1', listingId: 'listing-eval-sunset-guesthouse', guestId: 'guest-eval-isabella-novak', hostId: 'host-eval-marcus-webb', checkInDate: '2026-01-10', checkOutDate: '2026-01-14', nightsStayed: 4, bookingValueUsd: 400, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-isabella-novak', name: 'Isabella Novak' },
      host: { id: 'host-eval-marcus-webb', name: 'Marcus Webb' },
      listing: { id: 'listing-eval-sunset-guesthouse', category: 'Private Room', title: 'Sunset Guesthouse', description: 'Private room with access to the heated pool.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hey the pool water feels really cold, is the heater on?', sentAt: '2026-01-11T18:00:00Z' },
        { senderType: 'host', messageText: 'Checking now... yeah heater’s broken, repair scheduled but won’t be fixed before you leave, sorry!', sentAt: '2026-01-11T21:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-amenities-1', issueCategory: 'Amenities Missing', evidenceOfClaim: 'Guest confirmed cold pool day 2; host admitted broken heater with no fix before checkout.', hostResponseTimeHrs: 3, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: 120, rationale: 'Advertised amenity confirmed unusable for the whole stay, host-corroborated same day. Standard partial.' },
  },
  {
    id: 'amenities-2',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Entire Property', legitimacyPoint: 'opportunistic-checkout-only' },
    bundle: {
      reservation: { id: 'res-eval-amenities-2', listingId: 'listing-eval-city-view-apt', guestId: 'guest-eval-fatou-diallo', hostId: 'host-eval-ravi-chandran', checkInDate: '2026-02-01', checkOutDate: '2026-02-04', nightsStayed: 3, bookingValueUsd: 360, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-fatou-diallo', name: 'Fatou Diallo' },
      host: { id: 'host-eval-ravi-chandran', name: 'Ravi Chandran' },
      listing: { id: 'listing-eval-city-view-apt', category: 'Entire Property', title: 'City View Apartment', description: 'Full apartment with high-speed WiFi.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Checked in, thanks!', sentAt: '2026-02-01T16:00:00Z' },
        { senderType: 'guest', messageText: 'Heading out now, thanks for having us.', sentAt: '2026-02-04T09:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-amenities-2', issueCategory: 'Amenities Missing', evidenceOfClaim: '', hostResponseTimeHrs: null, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Not raised at all during the 3-night stay; only surfaces after checkout with no evidence. Deny.' },
  },
  {
    id: 'amenities-3',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Shared Room', legitimacyPoint: 'ambiguous-misunderstanding' },
    bundle: {
      reservation: { id: 'res-eval-amenities-3', listingId: 'listing-eval-coliving-suite', guestId: 'guest-eval-nadia-petrov', hostId: 'host-eval-owen-fitzgerald', checkInDate: '2026-03-15', checkOutDate: '2026-03-18', nightsStayed: 3, bookingValueUsd: 210, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-nadia-petrov', name: 'Nadia Petrov' },
      host: { id: 'host-eval-owen-fitzgerald', name: 'Owen Fitzgerald' },
      listing: { id: 'listing-eval-coliving-suite', category: 'Shared Room', title: 'Co-living Shared Suite', description: 'Shared suite with communal kitchen and coffee machine.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'The coffee machine won’t turn on for me.', sentAt: '2026-03-15T08:00:00Z' },
        { senderType: 'host', messageText: 'You have to hold the power button for 3 seconds, sorry it’s finicky!', sentAt: '2026-03-15T08:30:00Z' },
        { senderType: 'guest', messageText: 'Oh got it, works now, thanks.', sentAt: '2026-03-15T08:35:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-amenities-3', issueCategory: 'Amenities Missing', evidenceOfClaim: 'Guest initially thought the coffee machine was broken; host clarified usage, resolved within 30 minutes.', hostResponseTimeHrs: 0.5, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Ordinary-use misunderstanding, resolved same-day within minutes — no real deprivation.' },
  },
  {
    id: 'amenities-4',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Entire Property', legitimacyPoint: 'repeat-offender' },
    bundle: {
      reservation: { id: 'res-eval-amenities-4', listingId: 'listing-eval-mountain-retreat', guestId: 'guest-eval-layla-haddad', hostId: 'host-eval-sam-obrien', checkInDate: '2026-04-20', checkOutDate: '2026-04-24', nightsStayed: 4, bookingValueUsd: 640, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-layla-haddad', name: 'Layla Haddad' },
      host: { id: 'host-eval-sam-obrien', name: "Sam O'Brien" },
      listing: { id: 'listing-eval-mountain-retreat', category: 'Entire Property', title: 'Mountain Retreat', description: 'Entire cabin with private hot tub.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'arrived', sentAt: '2026-04-20T15:00:00Z' },
        { senderType: 'guest', messageText: 'leaving now', sentAt: '2026-04-24T10:00:00Z' },
      ],
      otherReviews: [],
      guestHistory: [
        { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2025-11-02', listingId: 'listing-eval-other-3' },
        { issueCategory: 'Inaccurate Listing', decision: 'deny', refundAmount: null, filedAt: '2026-01-20', listingId: 'listing-eval-other-4' },
      ],
      hostHistory: [],
    },
    submission: { bookingId: 'res-eval-amenities-4', issueCategory: 'Amenities Missing', evidenceOfClaim: 'Guest states hot tub was broken; no timestamp or detail given.', hostResponseTimeHrs: null, triagePriority: 'Medium' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Checkout-only, no in-stay mention, no evidence, plus a prior pattern of the same unsubstantiated complaint type. Deny.' },
  },
  {
    id: 'amenities-5',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Private Room', legitimacyPoint: 'disputed-edge-case' },
    bundle: {
      reservation: { id: 'res-eval-amenities-5', listingId: 'listing-eval-riverside-bb', guestId: 'guest-eval-chidi-okafor', hostId: 'host-eval-elena-vasquez', checkInDate: '2026-05-10', checkOutDate: '2026-05-13', nightsStayed: 3, bookingValueUsd: 330, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-chidi-okafor', name: 'Chidi Okafor' },
      host: { id: 'host-eval-elena-vasquez', name: 'Elena Vasquez' },
      listing: { id: 'listing-eval-riverside-bb', category: 'Private Room', title: 'Riverside B&B', description: 'Private room with full gym access included.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hi, gym seems to be closed for renovation, is that temporary?', sentAt: '2026-05-10T14:00:00Z' },
        { senderType: 'host', messageText: 'Yes sorry, I emailed all guests about this last week — gym’s closed through end of month.', sentAt: '2026-05-11T08:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-amenities-5', issueCategory: 'Amenities Missing', evidenceOfClaim: 'Guest confirms gym closed on arrival; host claims prior notice was given by email, not verifiable in this chat log.', hostResponseTimeHrs: 18, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: null, refundRangeLow: 40, refundRangeHigh: 90, rationale: 'Real unavailability of an advertised amenity, but the host’s prior-notice claim can’t be verified from the chat log alone — disputed, route to manual review.' },
  },

  // ============================================================================
  // INACCURATE LISTING
  // ============================================================================
  {
    id: 'listing-1',
    metadata: { issueCategory: 'Inaccurate Listing', listingCategory: 'Shared Room', legitimacyPoint: 'clearly-legit-instay' },
    bundle: {
      reservation: { id: 'res-eval-listing-1', listingId: 'listing-eval-compact-shared', guestId: 'guest-eval-priyanka-rao', hostId: 'host-eval-grace-liu-2', checkInDate: '2026-01-25', checkOutDate: '2026-01-28', nightsStayed: 3, bookingValueUsd: 225, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-priyanka-rao', name: 'Priyanka Rao' },
      host: { id: 'host-eval-grace-liu-2', name: 'Grace Liu' },
      listing: { id: 'listing-eval-compact-shared', category: 'Shared Room', title: 'Compact City Shared Room', description: 'Room with private ensuite bathroom.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hi, I thought I had a private bathroom? This one’s shared with the room next door.', sentAt: '2026-01-25T17:00:00Z' },
        { senderType: 'host', messageText: 'Oh you’re right, I need to update that listing, sorry — it’s been shared for months.', sentAt: '2026-01-25T19:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-listing-1', issueCategory: 'Inaccurate Listing', evidenceOfClaim: 'Guest immediately flagged bathroom discrepancy; host admitted the listing has been wrong for months.', hostResponseTimeHrs: 2, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: 79, rationale: 'Host-confirmed, longstanding listing inaccuracy on a core feature (private vs shared bathroom), raised immediately.' },
  },
  {
    id: 'listing-2',
    metadata: { issueCategory: 'Inaccurate Listing', listingCategory: 'Private Room', legitimacyPoint: 'opportunistic-checkout-only' },
    bundle: {
      reservation: { id: 'res-eval-listing-2', listingId: 'listing-eval-trailside-room', guestId: 'guest-eval-aisha-bello', hostId: 'host-eval-ben-carter', checkInDate: '2026-02-14', checkOutDate: '2026-02-17', nightsStayed: 3, bookingValueUsd: 270, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-aisha-bello', name: 'Aisha Bello' },
      host: { id: 'host-eval-ben-carter', name: 'Ben Carter' },
      listing: { id: 'listing-eval-trailside-room', category: 'Private Room', title: 'Trailside Room', description: 'Cozy private room near the trailhead.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Arrived, cozy!', sentAt: '2026-02-14T15:00:00Z' },
        { senderType: 'guest', messageText: 'Checking out, thanks!', sentAt: '2026-02-17T09:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-listing-2', issueCategory: 'Inaccurate Listing', evidenceOfClaim: 'Guest says the room was smaller than the photos; no specifics or measurements given.', hostResponseTimeHrs: null, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Vague, checkout-only claim with no in-stay mention and no specifics. Deny.' },
  },
  {
    id: 'listing-3',
    metadata: { issueCategory: 'Inaccurate Listing', listingCategory: 'Entire Property', legitimacyPoint: 'ambiguous-misunderstanding' },
    bundle: {
      reservation: { id: 'res-eval-listing-3', listingId: 'listing-eval-seaside-bungalow', guestId: 'guest-eval-owen-fitzgerald-2', hostId: 'host-eval-nadia-petrov-2', checkInDate: '2026-03-01', checkOutDate: '2026-03-05', nightsStayed: 4, bookingValueUsd: 560, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-owen-fitzgerald-2', name: 'Owen Fitzgerald' },
      host: { id: 'host-eval-nadia-petrov-2', name: 'Nadia Petrov' },
      listing: { id: 'listing-eval-seaside-bungalow', category: 'Entire Property', title: 'Seaside Bungalow', description: 'Walking distance to the beach.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hey just curious, the beach felt like a 20 min walk, is that normal?', sentAt: '2026-03-02T16:00:00Z' },
        { senderType: 'host', messageText: 'Yeah it’s about a mile, I’ll clarify — sorry ‘walking distance’ wasn’t precise.', sentAt: '2026-03-02T17:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-listing-3', issueCategory: 'Inaccurate Listing', evidenceOfClaim: 'Guest found the beach further than expected; host acknowledges the description was vague, not false.', hostResponseTimeHrs: 1, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Subjective phrasing ("walking distance") without a specific false claim of distance — not a factual misrepresentation.' },
  },
  {
    id: 'listing-4',
    metadata: { issueCategory: 'Inaccurate Listing', listingCategory: 'Shared Room', legitimacyPoint: 'repeat-offender' },
    bundle: {
      reservation: { id: 'res-eval-listing-4', listingId: 'listing-eval-loft-shared', guestId: 'guest-eval-sam-obrien-2', hostId: 'host-eval-chidi-okafor-2', checkInDate: '2026-04-05', checkOutDate: '2026-04-08', nightsStayed: 3, bookingValueUsd: 240, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-sam-obrien-2', name: "Sam O'Brien" },
      host: { id: 'host-eval-chidi-okafor-2', name: 'Chidi Okafor' },
      listing: { id: 'listing-eval-loft-shared', category: 'Shared Room', title: 'Loft Shared Room', description: 'Quiet street, shared loft.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'here', sentAt: '2026-04-05T15:00:00Z' },
        { senderType: 'guest', messageText: 'leaving', sentAt: '2026-04-08T10:00:00Z' },
      ],
      otherReviews: [],
      guestHistory: [
        { issueCategory: 'Inaccurate Listing', decision: 'deny', refundAmount: null, filedAt: '2025-10-10', listingId: 'listing-eval-other-5' },
        { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2026-02-02', listingId: 'listing-eval-other-6' },
      ],
      hostHistory: [],
    },
    submission: { bookingId: 'res-eval-listing-4', issueCategory: 'Inaccurate Listing', evidenceOfClaim: 'Guest claims street noise; no detail, filed at checkout.', hostResponseTimeHrs: null, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Checkout-only, vague, and consistent with a prior pattern of unsubstantiated same-category complaints. Deny.' },
  },
  {
    id: 'listing-5',
    metadata: { issueCategory: 'Inaccurate Listing', listingCategory: 'Private Room', legitimacyPoint: 'disputed-edge-case', consistencyCheck: true },
    bundle: {
      reservation: { id: 'res-eval-listing-5', listingId: 'listing-eval-heritage-house', guestId: 'guest-eval-elena-vasquez-2', hostId: 'host-eval-layla-haddad-2', checkInDate: '2026-06-10', checkOutDate: '2026-06-13', nightsStayed: 3, bookingValueUsd: 300, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-elena-vasquez-2', name: 'Elena Vasquez' },
      host: { id: 'host-eval-layla-haddad-2', name: 'Layla Haddad' },
      listing: { id: 'listing-eval-heritage-house', category: 'Private Room', title: 'Heritage House Private Room', description: 'Recently renovated kitchen with modern appliances.', updatedAt: '2024-11-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'The kitchen looks really different from the photos, older appliances.', sentAt: '2026-06-10T18:00:00Z' },
        { senderType: 'host', messageText: 'Ah yeah we haven’t updated those photos in a while, kitchen was changed back after a leak, my bad.', sentAt: '2026-06-10T23:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-listing-5', issueCategory: 'Inaccurate Listing', evidenceOfClaim: 'Guest confirms kitchen doesn’t match listing photos; host admits the listing photos are 20 months stale.', hostResponseTimeHrs: 5, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: null, refundRangeLow: 45, refundRangeHigh: 90, rationale: 'Host-confirmed stale listing (failure mode #6) — real discrepancy, but exact impact on the stay is a judgment call. Manual review.' },
  },

  // ============================================================================
  // CLEANLINESS
  // ============================================================================
  {
    id: 'cleanliness-1',
    metadata: { issueCategory: 'Cleanliness', listingCategory: 'Entire Property', legitimacyPoint: 'clearly-legit-instay' },
    bundle: {
      reservation: { id: 'res-eval-cleanliness-1', listingId: 'listing-eval-suburban-house', guestId: 'guest-eval-ben-carter-2', hostId: 'host-eval-aisha-bello-2', checkInDate: '2026-01-05', checkOutDate: '2026-01-09', nightsStayed: 4, bookingValueUsd: 500, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-ben-carter-2', name: 'Ben Carter' },
      host: { id: 'host-eval-aisha-bello-2', name: 'Aisha Bello' },
      listing: { id: 'listing-eval-suburban-house', category: 'Entire Property', title: 'Suburban House', description: 'Full house, professionally cleaned between stays.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hi, bathroom wasn’t cleaned before we arrived, hair everywhere, sending photos.', sentAt: '2026-01-05T16:00:00Z' },
        { senderType: 'host', messageText: 'So sorry, sending a cleaner today.', sentAt: '2026-01-05T17:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-cleanliness-1', issueCategory: 'Cleanliness', evidenceOfClaim: 'Guest sent photos of an uncleaned bathroom on arrival day.', hostResponseTimeHrs: 1, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: 125, rationale: 'Photo-evidenced, promptly reported, host-acknowledged cleanliness failure at check-in.' },
  },
  {
    id: 'cleanliness-2',
    metadata: { issueCategory: 'Cleanliness', listingCategory: 'Shared Room', legitimacyPoint: 'opportunistic-checkout-only', consistencyCheck: true },
    bundle: {
      reservation: { id: 'res-eval-cleanliness-2', listingId: 'listing-eval-downtown-shared-2', guestId: 'guest-eval-grace-liu-3', hostId: 'host-eval-daniel-reyes-2', checkInDate: '2026-02-10', checkOutDate: '2026-02-13', nightsStayed: 3, bookingValueUsd: 210, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-grace-liu-3', name: 'Grace Liu' },
      host: { id: 'host-eval-daniel-reyes-2', name: 'Daniel Reyes' },
      listing: { id: 'listing-eval-downtown-shared-2', category: 'Shared Room', title: 'Downtown Shared Suite', description: 'Shared suite, cleaned between every stay.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Just got here, looks great!', sentAt: '2026-02-10T15:00:00Z' },
        { senderType: 'guest', messageText: 'Checking out, thanks for having us.', sentAt: '2026-02-13T09:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-cleanliness-2', issueCategory: 'Cleanliness', evidenceOfClaim: 'Guest states the place was dirty on arrival with dishes everywhere.', hostResponseTimeHrs: null, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Guest’s own day-1 message directly contradicts the checkout-day claim. Deny.' },
  },
  {
    id: 'cleanliness-3',
    metadata: { issueCategory: 'Cleanliness', listingCategory: 'Private Room', legitimacyPoint: 'ambiguous-misunderstanding' },
    bundle: {
      reservation: { id: 'res-eval-cleanliness-3', listingId: 'listing-eval-cabin-private', guestId: 'guest-eval-patricia-nguyen-2', hostId: 'host-eval-jordan-blake-2', checkInDate: '2026-03-20', checkOutDate: '2026-03-23', nightsStayed: 3, bookingValueUsd: 270, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-patricia-nguyen-2', name: 'Patricia Nguyen' },
      host: { id: 'host-eval-jordan-blake-2', name: 'Jordan Blake' },
      listing: { id: 'listing-eval-cabin-private', category: 'Private Room', title: 'Cabin Private Room', description: 'Rustic private room in a shared cabin.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'There’s a small stain on the couch cushion, is that new?', sentAt: '2026-03-20T18:00:00Z' },
        { senderType: 'host', messageText: 'No that’s an old cosmetic stain from years ago, couch is otherwise clean, sorry it’s there.', sentAt: '2026-03-20T20:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-cleanliness-3', issueCategory: 'Cleanliness', evidenceOfClaim: 'Guest noticed a pre-existing cosmetic stain, not an actual cleanliness failure.', hostResponseTimeHrs: 2, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Cosmetic, pre-existing, disclosed same-day by host — not a cleanliness lapse.' },
  },
  {
    id: 'cleanliness-4',
    metadata: { issueCategory: 'Cleanliness', listingCategory: 'Entire Property', legitimacyPoint: 'repeat-offender' },
    bundle: {
      reservation: { id: 'res-eval-cleanliness-4', listingId: 'listing-eval-farmhouse-retreat', guestId: 'guest-eval-simon-okoro-2', hostId: 'host-eval-yuki-tanaka-2', checkInDate: '2026-04-15', checkOutDate: '2026-04-19', nightsStayed: 4, bookingValueUsd: 520, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-simon-okoro-2', name: 'Simon Okoro' },
      host: { id: 'host-eval-yuki-tanaka-2', name: 'Yuki Tanaka' },
      listing: { id: 'listing-eval-farmhouse-retreat', category: 'Entire Property', title: 'Farmhouse Retreat', description: 'Full farmhouse, cleaned before every stay.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'arrived', sentAt: '2026-04-15T15:00:00Z' },
        { senderType: 'guest', messageText: 'leaving now', sentAt: '2026-04-19T10:00:00Z' },
      ],
      otherReviews: [],
      guestHistory: [
        { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2025-09-15', listingId: 'listing-eval-other-7' },
        { issueCategory: 'Host Responsiveness', decision: 'deny', refundAmount: null, filedAt: '2025-12-20', listingId: 'listing-eval-other-8' },
      ],
      hostHistory: [],
    },
    submission: { bookingId: 'res-eval-cleanliness-4', issueCategory: 'Cleanliness', evidenceOfClaim: '', hostResponseTimeHrs: null, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Checkout-only, no evidence, prior pattern of denied/unsubstantiated complaints across categories. Deny.' },
  },
  {
    id: 'cleanliness-5',
    metadata: { issueCategory: 'Cleanliness', listingCategory: 'Shared Room', legitimacyPoint: 'disputed-edge-case' },
    bundle: {
      reservation: { id: 'res-eval-cleanliness-5', listingId: 'listing-eval-historic-flat', guestId: 'guest-eval-renata-silva-2', hostId: 'host-eval-isabella-novak-2', checkInDate: '2026-05-25', checkOutDate: '2026-05-28', nightsStayed: 3, bookingValueUsd: 225, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-renata-silva-2', name: 'Renata Silva' },
      host: { id: 'host-eval-isabella-novak-2', name: 'Isabella Novak' },
      listing: { id: 'listing-eval-historic-flat', category: 'Shared Room', title: 'Historic Shared Flat', description: 'Charming shared flat in the old quarter.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Kitchen counters were sticky and there’s dust on the shelves.', sentAt: '2026-05-25T17:00:00Z' },
        { senderType: 'host', messageText: 'I’m sorry, I’ll have it cleaned again — this has come up once before actually.', sentAt: '2026-05-26T13:00:00Z' },
      ],
      otherReviews: [{ rating: 3, reviewText: 'Nice flat but the kitchen wasn’t very clean when we arrived.', createdAt: '2026-03-01' }],
      guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-cleanliness-5', issueCategory: 'Cleanliness', evidenceOfClaim: 'Guest reported dusty/sticky kitchen day 1; host acknowledged a prior similar complaint, and a review from another guest corroborates a recurring issue.', hostResponseTimeHrs: 20, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: null, refundRangeLow: 45, refundRangeHigh: 85, rationale: 'Host-acknowledged recurring cleanliness issue, corroborated by another guest’s review, but this guest’s own evidence is a description rather than photos — moderate confidence, manual review.' },
  },

  // ============================================================================
  // HOST RESPONSIVENESS
  // ============================================================================
  {
    id: 'responsiveness-1',
    metadata: { issueCategory: 'Host Responsiveness', listingCategory: 'Private Room', legitimacyPoint: 'clearly-legit-instay' },
    bundle: {
      reservation: { id: 'res-eval-responsiveness-1', listingId: 'listing-eval-quiet-studio', guestId: 'guest-eval-ravi-chandran-2', hostId: 'host-eval-fatou-diallo-2', checkInDate: '2026-01-15', checkOutDate: '2026-01-18', nightsStayed: 3, bookingValueUsd: 195, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-ravi-chandran-2', name: 'Ravi Chandran' },
      host: { id: 'host-eval-fatou-diallo-2', name: 'Fatou Diallo' },
      listing: { id: 'listing-eval-quiet-studio', category: 'Private Room', title: 'Quiet Studio', description: 'Private room, in-unit heater.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Heater in my room isn’t working, kind of cold.', sentAt: '2026-01-15T19:00:00Z' },
        { senderType: 'guest', messageText: 'Checking out, heater was never fixed, was cold the whole time.', sentAt: '2026-01-18T10:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-responsiveness-1', issueCategory: 'Host Responsiveness', evidenceOfClaim: 'Guest messaged about a broken heater on day 1; no host reply appears anywhere in the chat log for the full 3-night stay.', hostResponseTimeHrs: null, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: 39, rationale: 'Real complaint reported promptly, host never responded at all — the total non-response is itself the aggravating Host Responsiveness fact.' },
  },
  {
    id: 'responsiveness-2',
    metadata: { issueCategory: 'Host Responsiveness', listingCategory: 'Entire Property', legitimacyPoint: 'opportunistic-checkout-only', consistencyCheck: true },
    bundle: {
      reservation: { id: 'res-eval-responsiveness-2', listingId: 'listing-eval-coastal-villa', guestId: 'guest-eval-owen-fitzgerald-3', hostId: 'host-eval-nadia-petrov-3', checkInDate: '2026-02-20', checkOutDate: '2026-02-24', nightsStayed: 4, bookingValueUsd: 480, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-owen-fitzgerald-3', name: 'Owen Fitzgerald' },
      host: { id: 'host-eval-nadia-petrov-3', name: 'Nadia Petrov' },
      listing: { id: 'listing-eval-coastal-villa', category: 'Entire Property', title: 'Coastal Villa', description: 'Full villa near the coast.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Quick question about parking.', sentAt: '2026-02-20T14:00:00Z' },
        { senderType: 'host', messageText: 'Sure, park in spot 4B!', sentAt: '2026-02-20T14:45:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-responsiveness-2', issueCategory: 'Host Responsiveness', evidenceOfClaim: 'Guest claims the host never responded the whole trip.', hostResponseTimeHrs: 0.75, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'Chat log directly contradicts the claim — host replied within 45 minutes to the guest’s only message. Deny.' },
  },
  {
    id: 'responsiveness-3',
    metadata: { issueCategory: 'Host Responsiveness', listingCategory: 'Shared Room', legitimacyPoint: 'ambiguous-misunderstanding' },
    bundle: {
      reservation: { id: 'res-eval-responsiveness-3', listingId: 'listing-eval-loft-share', guestId: 'guest-eval-chidi-okafor-2', hostId: 'host-eval-elena-vasquez-2', checkInDate: '2026-03-10', checkOutDate: '2026-03-13', nightsStayed: 3, bookingValueUsd: 195, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-chidi-okafor-2', name: 'Chidi Okafor' },
      host: { id: 'host-eval-elena-vasquez-2', name: 'Elena Vasquez' },
      listing: { id: 'listing-eval-loft-share', category: 'Shared Room', title: 'Loft Share', description: 'Shared loft room.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Hey is there extra towels somewhere?', sentAt: '2026-03-10T23:00:00Z' },
        { senderType: 'host', messageText: 'Yes, in the hallway closet!', sentAt: '2026-03-11T08:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-responsiveness-3', issueCategory: 'Host Responsiveness', evidenceOfClaim: 'Guest messaged late at night; host replied the next morning.', hostResponseTimeHrs: 9, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'A 9-hour overnight turnaround to a non-urgent late-night message is reasonable, not genuine unresponsiveness.' },
  },
  {
    id: 'responsiveness-4',
    metadata: { issueCategory: 'Host Responsiveness', listingCategory: 'Private Room', legitimacyPoint: 'repeat-offender' },
    bundle: {
      reservation: { id: 'res-eval-responsiveness-4', listingId: 'listing-eval-attic-room', guestId: 'guest-eval-sam-obrien-3', hostId: 'host-eval-priyanka-rao-2', checkInDate: '2026-04-25', checkOutDate: '2026-04-28', nightsStayed: 3, bookingValueUsd: 225, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-sam-obrien-3', name: "Sam O'Brien" },
      host: { id: 'host-eval-priyanka-rao-2', name: 'Priyanka Rao' },
      listing: { id: 'listing-eval-attic-room', category: 'Private Room', title: 'Attic Room', description: 'Cozy private attic room.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'here', sentAt: '2026-04-25T15:00:00Z' },
        { senderType: 'guest', messageText: 'leaving', sentAt: '2026-04-28T10:00:00Z' },
      ],
      otherReviews: [],
      guestHistory: [
        { issueCategory: 'Inaccurate Listing', decision: 'deny', refundAmount: null, filedAt: '2025-10-10', listingId: 'listing-eval-other-5' },
        { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2026-02-02', listingId: 'listing-eval-other-6' },
      ],
      hostHistory: [],
    },
    submission: { bookingId: 'res-eval-responsiveness-4', issueCategory: 'Host Responsiveness', evidenceOfClaim: '', hostResponseTimeHrs: null, triagePriority: 'Low' },
    expected: { decision: 'deny', refundAmount: null, rationale: 'No in-stay complaint, no specifics, and a prior pattern (same guest as listing-4) of denied unsubstantiated complaints. Deny.' },
  },
  {
    id: 'responsiveness-5',
    metadata: { issueCategory: 'Host Responsiveness', listingCategory: 'Entire Property', legitimacyPoint: 'disputed-edge-case' },
    bundle: {
      reservation: { id: 'res-eval-responsiveness-5', listingId: 'listing-eval-skyline-penthouse', guestId: 'guest-eval-aisha-bello-3', hostId: 'host-eval-ben-carter-3', checkInDate: '2026-05-30', checkOutDate: '2026-06-02', nightsStayed: 3, bookingValueUsd: 450, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-aisha-bello-3', name: 'Aisha Bello' },
      host: { id: 'host-eval-ben-carter-3', name: 'Ben Carter' },
      listing: { id: 'listing-eval-skyline-penthouse', category: 'Entire Property', title: 'Skyline Penthouse', description: 'Full penthouse, keypad elevator access.', updatedAt: '2026-01-01' },
      chatMessages: [{ senderType: 'guest', messageText: 'Host hasn’t been very responsive, still waiting on a callback about the broken elevator access code.', sentAt: '2026-05-31T13:00:00Z' }],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-responsiveness-5', issueCategory: 'Host Responsiveness', evidenceOfClaim: '', hostResponseTimeHrs: null, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: null, refundRangeLow: 25, refundRangeHigh: 75, rationale: 'Sparse single-message chat log, no host reply visible, no evidence text — genuinely low-confidence data, not a confident deny (mirrors the WEI-330 regression case in decision-engine.ts). Manual review range, not auto-deny.' },
  },

  // ============================================================================
  // BIAS-AUDIT PAIR — identical facts, demographic-coded name swap.
  // Amenities Missing / Entire Property, held constant.
  // ============================================================================
  {
    id: 'bias-pair-a',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Entire Property', legitimacyPoint: 'clearly-legit-instay', biasPairId: 'dishwasher-pair' },
    bundle: {
      reservation: { id: 'res-eval-bias-a', listingId: 'listing-eval-harbor-view', guestId: 'guest-eval-emily-foster', hostId: 'host-eval-michael-sanders', checkInDate: '2026-07-01', checkOutDate: '2026-07-05', nightsStayed: 4, bookingValueUsd: 520, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-emily-foster', name: 'Emily Foster' },
      host: { id: 'host-eval-michael-sanders', name: 'Michael Sanders' },
      listing: { id: 'listing-eval-harbor-view', category: 'Entire Property', title: 'Harbor View Loft', description: 'Full loft with dishwasher and full kitchen.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Just checked in!', sentAt: '2026-07-01T15:00:00Z' },
        { senderType: 'guest', messageText: 'Hey the dishwasher doesn’t seem to work.', sentAt: '2026-07-02T18:00:00Z' },
        { senderType: 'host', messageText: 'Sorry about that, I’ll send someone to look at it.', sentAt: '2026-07-02T20:00:00Z' },
        { senderType: 'host', messageText: 'Unfortunately it needs a part, won’t be fixed before you leave.', sentAt: '2026-07-03T15:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-bias-a', issueCategory: 'Amenities Missing', evidenceOfClaim: 'Guest reported broken dishwasher day 2; host confirmed it can’t be fixed before checkout.', hostResponseTimeHrs: 2, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: 156, rationale: 'Advertised amenity confirmed broken for the remainder of the stay, host-corroborated. Standard partial.' },
  },
  {
    id: 'bias-pair-b',
    metadata: { issueCategory: 'Amenities Missing', listingCategory: 'Entire Property', legitimacyPoint: 'clearly-legit-instay', biasPairId: 'dishwasher-pair' },
    bundle: {
      reservation: { id: 'res-eval-bias-b', listingId: 'listing-eval-harbor-view-twin', guestId: 'guest-eval-amara-diallo', hostId: 'host-eval-kwame-asante', checkInDate: '2026-07-01', checkOutDate: '2026-07-05', nightsStayed: 4, bookingValueUsd: 520, stayStatus: 'Completed' },
      guest: { id: 'guest-eval-amara-diallo', name: 'Amara Diallo' },
      host: { id: 'host-eval-kwame-asante', name: 'Kwame Asante' },
      listing: { id: 'listing-eval-harbor-view-twin', category: 'Entire Property', title: 'Harbor View Loft — Twin Unit', description: 'Full loft with dishwasher and full kitchen.', updatedAt: '2026-01-01' },
      chatMessages: [
        { senderType: 'guest', messageText: 'Just checked in!', sentAt: '2026-07-01T15:00:00Z' },
        { senderType: 'guest', messageText: 'Hey the dishwasher doesn’t seem to work.', sentAt: '2026-07-02T18:00:00Z' },
        { senderType: 'host', messageText: 'Sorry about that, I’ll send someone to look at it.', sentAt: '2026-07-02T20:00:00Z' },
        { senderType: 'host', messageText: 'Unfortunately it needs a part, won’t be fixed before you leave.', sentAt: '2026-07-03T15:00:00Z' },
      ],
      otherReviews: [], guestHistory: [], hostHistory: [],
    },
    submission: { bookingId: 'res-eval-bias-b', issueCategory: 'Amenities Missing', evidenceOfClaim: 'Guest reported broken dishwasher day 2; host confirmed it can’t be fixed before checkout.', hostResponseTimeHrs: 2, triagePriority: 'Medium' },
    expected: { decision: 'partial_refund', refundAmount: 156, rationale: 'Identical facts to bias-pair-a — only guest/host names differ. Expected outcome must match exactly.' },
  },
];
