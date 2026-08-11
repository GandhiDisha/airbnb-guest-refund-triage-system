// Domain types mirroring supabase-schema.sql enums and tables.
// Source: ../product-brief.md, ../prd.md

export type ListingCategory = 'Entire Property' | 'Shared Room' | 'Private Room';
export type StayStatus = 'Completed' | 'Ongoing' | 'Upcoming';
export type IssueCategory =
  | 'Safety/Security'
  | 'Amenities Missing'
  | 'Inaccurate Listing'
  | 'Cleanliness'
  | 'Host Responsiveness';
export type TriagePriority = 'High' | 'Medium' | 'Low';
export type ChatSender = 'guest' | 'host';
export type RefundDecision = 'full_refund' | 'partial_refund' | 'deny';

export interface ChatMessage {
  senderType: ChatSender;
  messageText: string;
  sentAt: string; // ISO timestamp
}

export interface Review {
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface PastCase {
  issueCategory: IssueCategory;
  decision: RefundDecision;
  refundAmount: number | null;
  filedAt: string;
  listingId: string;
}

// Everything auto-fetched once a booking ID is resolved — nothing here is agent-entered.
// (product-brief.md §4 items 3 & 12, §9 Decisions Log)
export interface CaseBundle {
  reservation: {
    id: string;
    listingId: string;
    guestId: string;
    hostId: string;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
    nightsStayed: number;
    bookingValueUsd: number;
    stayStatus: StayStatus;
  };
  guest: { id: string; name: string };
  host: { id: string; name: string };
  listing: {
    id: string;
    category: ListingCategory;
    title: string;
    description: string;
    updatedAt: string;
  };
  chatMessages: ChatMessage[];
  otherReviews: Review[]; // other guests' reviews of this listing
  guestHistory: PastCase[]; // this guest's past cases, any listing
  hostHistory: PastCase[]; // this host's past cases, any of their listings
}

// The fields an agent actually provides (product-brief.md §2 — nights/booking value moved to auto-fetch)
export interface AgentSubmission {
  bookingId: string;
  issueCategory: IssueCategory;
  evidenceOfClaim: string; // optional in practice — empty string if not provided
  hostResponseTimeHrs: number | null;
  triagePriority: TriagePriority;
}

export type TimingBucket = 'in_stay_prompt' | 'in_stay_late' | 'checkout_only' | 'ambiguous';

export interface DecisionFactors {
  baseSeverityPct: number;
  evidenceMultiplier: number;
  timingMultiplier: number;
  stayImpactFraction: number;
  guestCredibilityMultiplier: number;
  hostAccountabilityMultiplier: number;
  timingBucket: TimingBucket;
  nonEnglishChatDetected: boolean;
  matchedGuestMessage: ChatMessage | null;
}

// Output of the deterministic decision engine (product-brief.md §8) — no LLM involved.
export interface DecisionResult {
  decision: RefundDecision;
  refundAmount: number | null;
  refundRangeLow: number | null;
  refundRangeHigh: number | null;
  confidence: number; // 0-100
  needsManualReview: boolean;
  safetyEscalation: boolean;
  factors: DecisionFactors;
}

// Output of the LLM generation layer — grounded narration of the decision above, nothing more.
export interface NarrativeResult {
  rationale: string;
  draftResponse: string;
}

export interface TriageResult {
  caseId: string;
  recommendationId: string;
  decision: DecisionResult;
  narrative: NarrativeResult;
  bundle: CaseBundle;
  submission: AgentSubmission;
}

export interface CaseActionInput {
  caseId: string;
  recommendationId: string;
  finalDecision: RefundDecision;
  finalRefundAmount: number | null;
  overrodeRecommendation: boolean;
  overrideReason: string | null;
}
