import { NextResponse } from 'next/server';
import { z } from 'zod';
import { computeDecision } from '@/lib/decision-engine';
import { generateNarrative } from '@/lib/generate-narrative';
import { createRecommendation, createTriageCase, getCaseBundle } from '@/lib/data';
import type { AgentSubmission, TriageResult } from '@/lib/types';

const submissionSchema = z.object({
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
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission', details: parsed.error.flatten() }, { status: 400 });
  }
  const submission: AgentSubmission = parsed.data;

  const bundle = await getCaseBundle(submission.bookingId);
  if (!bundle) {
    return NextResponse.json({ error: `No reservation found for booking ID "${submission.bookingId}".` }, { status: 404 });
  }

  const decision = computeDecision(submission, bundle);
  const narrative = await generateNarrative(submission, bundle, decision);

  const caseId = await createTriageCase(bundle.reservation.id, submission, bundle.reservation.stayStatus);
  const recommendationId = await createRecommendation(caseId, decision, narrative);

  const result: TriageResult = { caseId, recommendationId, decision, narrative, bundle, submission };
  return NextResponse.json(result);
}
