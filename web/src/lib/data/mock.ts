import { randomUUID } from 'crypto';
import { MOCK_BOOKINGS } from '../mock/fixtures';
import type {
  AgentSubmission,
  CaseActionInput,
  CaseBundle,
  DecisionResult,
  NarrativeResult,
  ReservationSummary,
} from '../types';

// In-memory only — resets on server restart. Mock mode is for local dev/demo,
// not durable storage; see ../config.ts.
const cases: { id: string; bookingId: string; submission: AgentSubmission }[] = [];
const recommendations: { id: string; caseId: string; decision: DecisionResult; narrative: NarrativeResult }[] = [];
const actions: (CaseActionInput & { id: string })[] = [];

export async function getCaseBundleMock(bookingId: string): Promise<CaseBundle | null> {
  return MOCK_BOOKINGS[bookingId] ?? null;
}

export async function listReservationsMock(): Promise<ReservationSummary[]> {
  return Object.entries(MOCK_BOOKINGS).map(([bookingId, bundle]) => ({
    bookingId,
    guestName: bundle.guest.name,
    listingTitle: bundle.listing.title,
    checkInDate: bundle.reservation.checkInDate,
    checkOutDate: bundle.reservation.checkOutDate,
    stayStatus: bundle.reservation.stayStatus,
  }));
}

export async function createTriageCaseMock(bookingId: string, submission: AgentSubmission): Promise<string> {
  const id = randomUUID();
  cases.push({ id, bookingId, submission });
  return id;
}

export async function createRecommendationMock(
  caseId: string,
  decision: DecisionResult,
  narrative: NarrativeResult,
): Promise<string> {
  const id = randomUUID();
  recommendations.push({ id, caseId, decision, narrative });
  return id;
}

export async function createCaseActionMock(input: CaseActionInput): Promise<string> {
  const id = randomUUID();
  actions.push({ ...input, id });
  return id;
}
