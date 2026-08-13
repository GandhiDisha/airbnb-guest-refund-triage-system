import { NextResponse } from 'next/server';
import { z } from 'zod';
import { computeDecision } from '@/lib/decision-engine';
import { generateNarrative } from '@/lib/generate-narrative';
import { createRecommendation, createTriageCase, getCaseBundle } from '@/lib/data';
import { DEFAULT_MODEL } from '@/lib/config';
import { MODEL_IDS, type AgentSubmission, type TriageResult } from '@/lib/types';

const requestSchema = z.object({
  bookingId: z.string().min(1),
  issueCategory: z.enum([
    'Safety/Security',
    'Amenities Missing',
    'Inaccurate Listing',
    'Cleanliness',
    'Host Responsiveness',
  ]),
  evidenceOfClaim: z.string().default(''),
  hostResponseTimeHrs: z.number().nullable().default(null),
  triagePriority: z.enum(['High', 'Medium', 'Low']),
  model: z.enum(MODEL_IDS).default(DEFAULT_MODEL),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission', details: parsed.error.flatten() }, { status: 400 });
  }
  const { model, ...submission }: AgentSubmission & { model: (typeof MODEL_IDS)[number] } = parsed.data;

  const bundle = await getCaseBundle(submission.bookingId);
  if (!bundle) {
    return NextResponse.json({ error: `No reservation found for booking ID "${submission.bookingId}".` }, { status: 404 });
  }

  const decision = computeDecision(submission, bundle);
  const narrative = await generateNarrative(submission, bundle, decision, model);

  const caseId = await createTriageCase(bundle.reservation.id, submission, bundle.reservation.stayStatus);
  const recommendationId = await createRecommendation(caseId, decision, narrative);

  const result: TriageResult = { caseId, recommendationId, decision, narrative, bundle, submission };
  return NextResponse.json(result);
}
