// Single entry point the rest of the app calls — hides whether we're reading
// mock fixtures or real Supabase behind the config.useMockData flag.

import { config } from '../config';
import type { AgentSubmission, CaseActionInput, CaseBundle, DecisionResult, NarrativeResult } from '../types';
import { createCaseActionMock, createRecommendationMock, createTriageCaseMock, getCaseBundleMock } from './mock';
import { createCaseActionSupabase, createRecommendationSupabase, createTriageCaseSupabase, getCaseBundleSupabase } from './supabase';

// No agent-auth system yet (PRD open question) — single placeholder agent for this prototype.
const PLACEHOLDER_AGENT_ID = 'agent-prototype-user';

export async function getCaseBundle(bookingId: string): Promise<CaseBundle | null> {
  return config.useMockData ? getCaseBundleMock(bookingId) : getCaseBundleSupabase(bookingId);
}

export async function createTriageCase(
  bookingId: string,
  submission: AgentSubmission,
  statusOfStay: CaseBundle['reservation']['stayStatus'],
): Promise<string> {
  return config.useMockData
    ? createTriageCaseMock(bookingId, submission)
    : createTriageCaseSupabase(bookingId, PLACEHOLDER_AGENT_ID, submission, statusOfStay);
}

export async function createRecommendation(
  caseId: string,
  decision: DecisionResult,
  narrative: NarrativeResult,
): Promise<string> {
  return config.useMockData
    ? createRecommendationMock(caseId, decision, narrative)
    : createRecommendationSupabase(caseId, decision, narrative);
}

export async function createCaseAction(input: CaseActionInput): Promise<string> {
  return config.useMockData ? createCaseActionMock(input) : createCaseActionSupabase(PLACEHOLDER_AGENT_ID, input);
}
