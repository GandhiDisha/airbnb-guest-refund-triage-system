import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCaseAction } from '@/lib/data';

const actionSchema = z.object({
  caseId: z.string().min(1),
  recommendationId: z.string().min(1),
  finalDecision: z.enum(['full_refund', 'partial_refund', 'deny']),
  finalRefundAmount: z.number().nullable(),
  overrodeRecommendation: z.boolean(),
  overrideReason: z.string().nullable(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action', details: parsed.error.flatten() }, { status: 400 });
  }

  const id = await createCaseAction(parsed.data);
  return NextResponse.json({ id });
}
