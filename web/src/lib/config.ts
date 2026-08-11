// Feature flags derived from env presence, so the app runs end-to-end with zero
// credentials (mock data + templated narrative) and upgrades automatically once
// real Supabase/Anthropic env vars are set. See ../README.md.

export const config = {
  useMockData: !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY,
  useMockLlm: !process.env.ANTHROPIC_API_KEY,
} as const;

export const ANTHROPIC_MODEL = 'claude-sonnet-5';
