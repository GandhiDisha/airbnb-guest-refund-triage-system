// Real Supabase data layer, matching ../../supabase-schema.sql exactly.
// Only exercised once SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set (see ../config.ts).
// Service-role key is server-only — never expose it to the client.

import { createClient } from '@supabase/supabase-js';
import type {
  AgentSubmission,
  CaseActionInput,
  CaseBundle,
  ChatMessage,
  DecisionResult,
  IssueCategory,
  NarrativeResult,
  PastCase,
  RefundDecision,
  ReservationSummary,
  Review,
} from '../types';

function client() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function pastCasesFor(reservationIds: string[]): Promise<PastCase[]> {
  if (reservationIds.length === 0) return [];
  const supabase = client();

  const { data: pastCases } = await supabase
    .from('triage_cases')
    .select('id, issue_category, reservation_id, filed_at')
    .in('reservation_id', reservationIds);
  if (!pastCases || pastCases.length === 0) return [];

  const caseIds = pastCases.map((c) => c.id);
  const { data: recs } = await supabase
    .from('triage_recommendations')
    .select('case_id, decision, refund_amount, created_at')
    .in('case_id', caseIds)
    .order('created_at', { ascending: true });

  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, listing_id')
    .in('id', reservationIds);
  const listingByReservation = new Map((reservations ?? []).map((r) => [r.id, r.listing_id as string]));

  // one recommendation per case (most recent, in case a case was re-analyzed)
  const latestRecByCase = new Map<string, { decision: RefundDecision; refund_amount: number | null }>();
  for (const rec of recs ?? []) {
    latestRecByCase.set(rec.case_id, { decision: rec.decision, refund_amount: rec.refund_amount });
  }

  return pastCases
    .filter((c) => latestRecByCase.has(c.id))
    .map((c) => {
      const rec = latestRecByCase.get(c.id)!;
      return {
        issueCategory: c.issue_category as IssueCategory,
        decision: rec.decision,
        refundAmount: rec.refund_amount,
        filedAt: c.filed_at,
        listingId: listingByReservation.get(c.reservation_id) ?? '',
      };
    });
}

export async function listReservationsSupabase(): Promise<ReservationSummary[]> {
  const supabase = client();
  const { data, error } = await supabase
    .from('reservations')
    .select('id, check_in_date, check_out_date, stay_status, guests(name), listings(title)')
    .order('check_in_date', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r) => {
    // Embedded to-one relations can come back as an object or a single-element array
    // depending on the supabase-js version's relationship inference.
    const guest = Array.isArray(r.guests) ? r.guests[0] : r.guests;
    const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings;
    return {
      bookingId: r.id,
      guestName: guest?.name ?? 'Unknown guest',
      listingTitle: listing?.title ?? 'Unknown listing',
      checkInDate: r.check_in_date,
      checkOutDate: r.check_out_date,
      stayStatus: r.stay_status,
    };
  });
}

export async function getCaseBundleSupabase(bookingId: string): Promise<CaseBundle | null> {
  const supabase = client();

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, listing_id, guest_id, check_in_date, check_out_date, nights_stayed, booking_value_usd, stay_status')
    .eq('id', bookingId)
    .maybeSingle();
  if (!reservation) return null;

  const { data: listing } = await supabase
    .from('listings')
    .select('id, host_id, category, title, description, updated_at')
    .eq('id', reservation.listing_id)
    .single();
  if (!listing) return null;

  const [{ data: guest }, { data: host }] = await Promise.all([
    supabase.from('guests').select('id, name').eq('id', reservation.guest_id).single(),
    supabase.from('hosts').select('id, name').eq('id', listing.host_id).single(),
  ]);
  if (!guest || !host) return null;

  const { data: chatRows } = await supabase
    .from('chat_messages')
    .select('sender_type, message_text, sent_at')
    .eq('reservation_id', reservation.id)
    .order('sent_at', { ascending: true });

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('rating, review_text, created_at')
    .eq('listing_id', listing.id)
    .neq('guest_id', reservation.guest_id);

  const { data: guestReservations } = await supabase
    .from('reservations')
    .select('id')
    .eq('guest_id', reservation.guest_id);
  const guestHistory = await pastCasesFor((guestReservations ?? []).map((r) => r.id).filter((id) => id !== reservation.id));

  const { data: hostListings } = await supabase.from('listings').select('id').eq('host_id', listing.host_id);
  const { data: hostReservations } = await supabase
    .from('reservations')
    .select('id')
    .in('listing_id', (hostListings ?? []).map((l) => l.id));
  const hostHistory = await pastCasesFor((hostReservations ?? []).map((r) => r.id).filter((id) => id !== reservation.id));

  const chatMessages: ChatMessage[] = (chatRows ?? []).map((r) => ({
    senderType: r.sender_type,
    messageText: r.message_text,
    sentAt: r.sent_at,
  }));
  const otherReviews: Review[] = (reviewRows ?? []).map((r) => ({
    rating: r.rating,
    reviewText: r.review_text,
    createdAt: r.created_at,
  }));

  return {
    reservation: {
      id: reservation.id,
      listingId: reservation.listing_id,
      guestId: reservation.guest_id,
      hostId: listing.host_id,
      checkInDate: reservation.check_in_date,
      checkOutDate: reservation.check_out_date,
      nightsStayed: reservation.nights_stayed,
      bookingValueUsd: Number(reservation.booking_value_usd),
      stayStatus: reservation.stay_status,
    },
    guest: { id: guest.id, name: guest.name },
    host: { id: host.id, name: host.name },
    listing: {
      id: listing.id,
      category: listing.category,
      title: listing.title,
      description: listing.description,
      updatedAt: listing.updated_at,
    },
    chatMessages,
    otherReviews,
    guestHistory,
    hostHistory,
  };
}

export async function createTriageCaseSupabase(
  bookingId: string,
  agentId: string,
  submission: AgentSubmission,
  statusOfStay: CaseBundle['reservation']['stayStatus'],
): Promise<string> {
  const supabase = client();
  const { data, error } = await supabase
    .from('triage_cases')
    .insert({
      reservation_id: bookingId,
      agent_id: agentId,
      status_of_stay: statusOfStay,
      issue_category: submission.issueCategory,
      evidence_of_claim: submission.evidenceOfClaim || null,
      host_response_time_hrs: submission.hostResponseTimeHrs,
      triage_priority: submission.triagePriority,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createRecommendationSupabase(
  caseId: string,
  decision: DecisionResult,
  narrative: NarrativeResult,
): Promise<string> {
  const supabase = client();
  const { data, error } = await supabase
    .from('triage_recommendations')
    .insert({
      case_id: caseId,
      decision: decision.decision,
      refund_amount: decision.refundAmount,
      refund_range_low: decision.refundRangeLow,
      refund_range_high: decision.refundRangeHigh,
      confidence: decision.confidence,
      needs_manual_review: decision.needsManualReview,
      safety_escalation: decision.safetyEscalation,
      rationale: narrative.rationale,
      draft_response: narrative.draftResponse,
      model_version: 'refund-triage-v1',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createCaseActionSupabase(agentId: string, input: CaseActionInput): Promise<string> {
  const supabase = client();
  const { data, error } = await supabase
    .from('case_actions')
    .insert({
      case_id: input.caseId,
      recommendation_id: input.recommendationId,
      agent_id: agentId,
      final_decision: input.finalDecision,
      final_refund_amount: input.finalRefundAmount,
      overrode_recommendation: input.overrodeRecommendation,
      override_reason: input.overrideReason,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
