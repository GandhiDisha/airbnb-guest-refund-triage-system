// Feature flags derived from env presence, so the app runs end-to-end with zero
// credentials (mock data + templated narrative) and upgrades automatically once
// real Supabase/Anthropic env vars are set. See ../README.md.

import type { ModelOption } from './types';

export const config = {
  useMockData: !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY,
  useMockLlm: !process.env.ANTHROPIC_API_KEY,
} as const;

// Curated model choices offered to the agent, with list pricing per million tokens
// (Anthropic first-party API rates, checked 2026-06-24 — see platform.claude.com/docs/en/pricing
// for current figures). Sonnet 5 has a lower introductory rate through 2026-08-31; we price at
// the standard post-intro rate here so displayed costs don't silently become inaccurate once
// the intro period ends without a code change.
export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — fastest, cheapest', inputPer1M: 1.0, outputPer1M: 5.0 },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 — balanced (default)', inputPer1M: 3.0, outputPer1M: 15.0 },
  { id: 'claude-opus-5', label: 'Claude Opus 5 — most capable', inputPer1M: 5.0, outputPer1M: 25.0 },
];

export const DEFAULT_MODEL = 'claude-sonnet-5' as const;
