-- Guest Refund Triage Tool — Supabase (Postgres) schema for mock/seed data
-- Source: prd.md, product-brief.md (same folder)
--
-- Design notes:
-- - 10 tables, each traceable to a specific requirement in the PRD/brief — no speculative tables.
-- - "Guest complaint history" and "host complaint history" (brief §3 item 1) are NOT a separate
--   table: they're just past rows in triage_cases/triage_recommendations, joined by guest_id/host_id
--   through reservations/listings. Seed historical rows with backdated filed_at to represent history
--   that predates this tool.
-- - Reservations are the single source of truth for nights stayed / booking value / stay dates
--   (product-brief.md §9 Decisions Log) — never re-entered on a triage case.
-- - triage_cases stores a point-in-time snapshot of stay status, since a stay can transition
--   (Ongoing -> Completed) after a case was filed against it.

-- ============================================================================
-- ENUM TYPES (mirror the exact vocabularies in problem-statement.md / prd.md)
-- ============================================================================

create type listing_category as enum ('Entire Property', 'Shared Room', 'Private Room');
create type stay_status as enum ('Completed', 'Ongoing', 'Upcoming');
create type issue_category as enum ('Safety/Security', 'Amenities Missing', 'Inaccurate Listing', 'Cleanliness', 'Host Responsiveness');
create type triage_priority as enum ('High', 'Medium', 'Low');
create type chat_sender as enum ('guest', 'host');
create type refund_decision as enum ('full_refund', 'partial_refund', 'deny');

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

create table agents (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

create table guests (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

create table hosts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

create table listings (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references hosts(id) on delete cascade,
  category       listing_category not null,
  title          text not null,
  description    text not null,          -- what the listing "promises or disclaims" (brief §3 item 2)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()  -- staleness matters, see brief failure mode 6
);

create index idx_listings_host on listings(host_id);

-- ============================================================================
-- RESERVATIONS — source of truth for nights stayed / booking value / stay dates
-- ============================================================================

create table reservations (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references listings(id) on delete cascade,
  guest_id          uuid not null references guests(id) on delete cascade,
  check_in_date     date not null,
  check_out_date    date not null check (check_out_date > check_in_date),
  nights_stayed     integer generated always as (check_out_date - check_in_date) stored,
  booking_value_usd numeric(10,2) not null check (booking_value_usd >= 0),
  stay_status       stay_status not null,
  created_at        timestamptz not null default now()
);

create index idx_reservations_guest on reservations(guest_id);
create index idx_reservations_listing on reservations(listing_id);

-- ============================================================================
-- REVIEWS — for "does this issue recur across other guests of the same unit" (brief §3 item 3)
-- ============================================================================

create table reviews (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references listings(id) on delete cascade,
  guest_id       uuid not null references guests(id) on delete cascade,
  reservation_id uuid references reservations(id) on delete set null,
  rating         smallint not null check (rating between 1 and 5),
  review_text    text not null,
  created_at     timestamptz not null default now()
);

create index idx_reviews_listing on reviews(listing_id);

-- ============================================================================
-- CHAT MESSAGES — the in-stay message thread, timestamped for timing analysis
-- (brief §3 item 4 / §6 failure mode 2 — the single most load-bearing signal)
-- ============================================================================

create table chat_messages (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  sender_type    chat_sender not null,
  message_text   text not null,
  sent_at        timestamptz not null
);

create index idx_chat_messages_reservation on chat_messages(reservation_id, sent_at);

-- ============================================================================
-- TRIAGE CASES — the agent-submitted complaint (7 agent-provided fields + booking ref)
-- ============================================================================

create table triage_cases (
  id                     uuid primary key default gen_random_uuid(),
  reservation_id         uuid not null references reservations(id) on delete cascade,
  agent_id               uuid not null references agents(id),
  status_of_stay         stay_status not null,       -- snapshot at filing time
  issue_category         issue_category not null,
  evidence_of_claim      text,                        -- optional (brief assumption 2 / failure mode 12)
  host_response_time_hrs numeric(6,2),                -- optional, agent-entered
  triage_priority        triage_priority not null,    -- set upstream (brief §4 assumption 4)
  filed_at               timestamptz not null default now(),
  created_at             timestamptz not null default now()
);

create index idx_triage_cases_reservation on triage_cases(reservation_id);
create index idx_triage_cases_agent on triage_cases(agent_id);
-- Enables "how many complaints has this guest/host made" via joins through reservations/listings:
create index idx_triage_cases_filed_at on triage_cases(filed_at);

-- ============================================================================
-- TRIAGE RECOMMENDATIONS — the tool's output for a case (1:many — a case can be re-analyzed)
-- ============================================================================

create table triage_recommendations (
  id                   uuid primary key default gen_random_uuid(),
  case_id              uuid not null references triage_cases(id) on delete cascade,
  decision             refund_decision not null,
  refund_amount        numeric(10,2) check (refund_amount is null or refund_amount >= 0),
  refund_range_low     numeric(10,2) check (refund_range_low is null or refund_range_low >= 0),
  refund_range_high    numeric(10,2) check (refund_range_high is null or refund_range_high >= refund_range_low),
  confidence           numeric(5,2) not null check (confidence between 0 and 100),
  needs_manual_review  boolean not null default false,   -- true when confidence < 70 (product-brief.md §8)
  safety_escalation    boolean not null default false,   -- always true when issue_category = 'Safety/Security'
  rationale            text not null,
  draft_response       text not null,
  model_version        text not null,
  created_at           timestamptz not null default now(),
  -- exactly one of (refund_amount) or (refund_range_low, refund_range_high) is set, matching the
  -- point-estimate-vs-range gate in product-brief.md §8/§9:
  constraint chk_amount_xor_range check (
    (refund_amount is not null and refund_range_low is null and refund_range_high is null)
    or (refund_amount is null and refund_range_low is not null and refund_range_high is not null)
    or (decision = 'deny' and refund_amount is null and refund_range_low is null and refund_range_high is null)
  )
);

create index idx_triage_recommendations_case on triage_recommendations(case_id);

-- ============================================================================
-- CASE ACTIONS — audit trail of what the agent actually did (PRD P0-7, P1-4)
-- ============================================================================

create table case_actions (
  id                   uuid primary key default gen_random_uuid(),
  case_id              uuid not null references triage_cases(id) on delete cascade,
  recommendation_id    uuid not null references triage_recommendations(id),
  agent_id             uuid not null references agents(id),
  final_decision          refund_decision not null,
  final_refund_amount     numeric(10,2) check (final_refund_amount is null or final_refund_amount >= 0),
  overrode_recommendation boolean not null,  -- set by the app: true if final_decision/amount differ from the recommendation
  override_reason         text,
  action_at            timestamptz not null default now()
);

create index idx_case_actions_case on case_actions(case_id);
create index idx_case_actions_agent on case_actions(agent_id);

-- ============================================================================
-- ROW LEVEL SECURITY — stub (agents only see cases; PII stays behind auth)
-- Tighten per actual Supabase auth setup before this leaves prototype stage.
-- ============================================================================

alter table triage_cases enable row level security;
alter table triage_recommendations enable row level security;
alter table case_actions enable row level security;

create policy "authenticated agents can read triage data"
  on triage_cases for select
  using (auth.role() = 'authenticated');

create policy "authenticated agents can read recommendations"
  on triage_recommendations for select
  using (auth.role() = 'authenticated');

create policy "authenticated agents can read case actions"
  on case_actions for select
  using (auth.role() = 'authenticated');
