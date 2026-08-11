-- Guest Refund Triage Tool — mock/seed data
-- Run after supabase-schema.sql. All IDs are fixed (not gen_random_uuid()) so rows are
-- traceable and linkable by hand across tables — the first hex digit marks the table:
--   1=agents 2=guests 3=hosts 4=listings 5=reservations 6=reviews
--   7=chat_messages 8=triage_cases 9=triage_recommendations a=case_actions
--
-- Narrative built to satisfy the "Test Data Requirements" in test-scenarios.md:
--   - guest with unsubstantiated-complaint pattern (Derek Miller)
--   - guest with LEGITIMATE past complaints — false-positive guard (Sofia Ramirez)
--   - host with recurring same-defect complaints across guests (Diane Walsh / Cozy Beach Bungalow)
--   - stale listing description (Cozy Beach Bungalow, updated 14+ months ago)
--   - chat logs: prompt in-stay report, checkout-only report, sparse/ambiguous, non-English
--   - demographic-coded name pair with identical facts, for bias audit (Emily Johnson / Amara Okafor,
--     and host pair Michael Thompson / Kwame Mensah)
--   - reservations of varying length ($220–$1050) and duration (2–7 nights)
--   - a Safety/Security case, to test the mandatory-escalation rule independent of confidence
--   - one Ongoing and one Upcoming reservation, for stay_status coverage with no complaint filed

-- ============================================================================
-- AGENTS
-- ============================================================================

insert into agents (id, name, email) values
  ('10000000-0000-0000-0000-000000000001', 'Maria Chen',   'maria.chen@triage.example.com'),
  ('10000000-0000-0000-0000-000000000002', 'Jordan Patel', 'jordan.patel@triage.example.com');

-- ============================================================================
-- GUESTS
-- ============================================================================

insert into guests (id, name, email) values
  ('20000000-0000-0000-0000-000000000001', 'Emily Johnson',   'emily.johnson@mail.example.com'),
  ('20000000-0000-0000-0000-000000000002', 'Amara Okafor',    'amara.okafor@mail.example.com'),
  ('20000000-0000-0000-0000-000000000003', 'Derek Miller',    'derek.miller@mail.example.com'),
  ('20000000-0000-0000-0000-000000000004', 'Sofia Ramirez',   'sofia.ramirez@mail.example.com'),
  ('20000000-0000-0000-0000-000000000005', 'Wei Zhang',       'wei.zhang@mail.example.com'),
  ('20000000-0000-0000-0000-000000000006', 'Fatima Hassan',   'fatima.hassan@mail.example.com'),
  ('20000000-0000-0000-0000-000000000007', 'Ryan O''Connell', 'ryan.oconnell@mail.example.com'),
  ('20000000-0000-0000-0000-000000000008', 'Haruto Sato',     'haruto.sato@mail.example.com'),
  ('20000000-0000-0000-0000-000000000009', 'Noah Williams',   'noah.williams@mail.example.com'),
  ('20000000-0000-0000-0000-000000000010', 'Grace Kim',       'grace.kim@mail.example.com'),
  ('20000000-0000-0000-0000-000000000011', 'Olivia Brooks',   'olivia.brooks@mail.example.com'),
  ('20000000-0000-0000-0000-000000000012', 'Liam Carter',     'liam.carter@mail.example.com'),
  ('20000000-0000-0000-0000-000000000013', 'Zara Ahmed',      'zara.ahmed@mail.example.com');

-- ============================================================================
-- HOSTS
-- ============================================================================

insert into hosts (id, name, email) values
  ('30000000-0000-0000-0000-000000000001', 'Michael Thompson', 'michael.thompson@hosts.example.com'),
  ('30000000-0000-0000-0000-000000000002', 'Kwame Mensah',     'kwame.mensah@hosts.example.com'),
  ('30000000-0000-0000-0000-000000000003', 'Diane Walsh',      'diane.walsh@hosts.example.com'),
  ('30000000-0000-0000-0000-000000000004', 'Carlos Mendez',    'carlos.mendez@hosts.example.com'),
  ('30000000-0000-0000-0000-000000000005', 'Priya Nair',       'priya.nair@hosts.example.com');

-- ============================================================================
-- LISTINGS
-- ============================================================================

insert into listings (id, host_id, category, title, description, created_at, updated_at) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
   'Entire Property', 'Downtown Loft with Skyline View',
   'Bright 1-bedroom loft downtown. Central AC, full kitchen, high-speed WiFi, walk to transit.',
   '2024-03-01', '2026-06-15'),

  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002',
   'Entire Property', 'Downtown Loft with Skyline View — Twin Unit',
   'Bright 1-bedroom loft downtown. Central AC, full kitchen, high-speed WiFi, walk to transit.',
   '2024-03-01', '2026-06-15'),

  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003',
   'Entire Property', 'Cozy Beach Bungalow',
   'Charming 2-bedroom bungalow 5 min from the beach. Reliable central AC, private patio, beach gear provided.',
   '2023-05-10', '2025-05-20'),

  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004',
   'Private Room', 'Modern Studio near Transit',
   'Private room in a modern studio building. Dedicated parking spot included, shared kitchen, quiet block.',
   '2024-08-01', '2026-07-01'),

  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005',
   'Entire Property', 'Sunny Garden Apartment',
   'Ground-floor 1-bedroom with a private garden entrance. Freshly cleaned between every stay, close to shops.',
   '2024-01-15', '2026-07-20'),

  ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004',
   'Entire Property', 'Riverside Cottage',
   'Quiet 1-bedroom cottage on the river. AC unit in bedroom, small dock access, pet-friendly.',
   '2024-05-01', '2026-05-01');

-- ============================================================================
-- RESERVATIONS
-- ============================================================================

insert into reservations (id, listing_id, guest_id, check_in_date, check_out_date, booking_value_usd, stay_status) values
  -- current cases
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-07-01', '2026-07-06', 750.00, 'Completed'), -- Emily Johnson @ Downtown Loft
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '2026-07-01', '2026-07-06', 750.00, 'Completed'), -- Amara Okafor @ Downtown Loft Twin (bias-pair mirror of R01)
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '2026-07-20', '2026-07-23', 360.00, 'Completed'), -- Derek Miller current
  ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', '2026-07-25', '2026-07-29', 480.00, 'Completed'), -- Sofia Ramirez current
  ('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000005', '2026-08-01', '2026-08-04', 330.00, 'Completed'), -- Wei Zhang current
  ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', '2026-07-28', '2026-08-03', 900.00, 'Completed'), -- Fatima Hassan current
  ('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000007', '2026-08-02', '2026-08-07', 600.00, 'Completed'), -- Ryan O'Connell current
  ('50000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000008', '2026-07-15', '2026-07-19', 500.00, 'Completed'), -- Haruto Sato current
  ('50000000-0000-0000-0000-000000000016', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000011', '2026-08-03', '2026-08-06', 390.00, 'Completed'), -- Olivia Brooks current (Safety/Security)

  -- historical (pre-dates the tool; used to build guest/host complaint history)
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '2025-11-10', '2025-11-14', 500.00, 'Completed'), -- Derek Miller hist #1
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', '2026-02-05', '2026-02-07', 260.00, 'Completed'), -- Derek Miller hist #2
  ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '2025-09-01', '2025-09-04', 450.00, 'Completed'), -- Sofia Ramirez hist #1
  ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '2026-01-10', '2026-01-15', 650.00, 'Completed'), -- Sofia Ramirez hist #2
  ('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '2025-12-01', '2025-12-03', 220.00, 'Completed'), -- Wei Zhang hist #1
  ('50000000-0000-0000-0000-000000000015', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000010', '2025-12-15', '2025-12-20', 650.00, 'Completed'), -- Grace Kim hist (AC, same defect as Fatima's current case)

  -- review-only stay (no complaint ever filed, just an unprompted review)
  ('50000000-0000-0000-0000-000000000014', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000009', '2025-10-01', '2025-10-04', 390.00, 'Completed'), -- Noah Williams

  -- stay_status coverage: Ongoing / Upcoming, no complaint filed on either
  ('50000000-0000-0000-0000-000000000017', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000012', '2026-08-05', '2026-08-12', 1050.00, 'Ongoing'),  -- Liam Carter
  ('50000000-0000-0000-0000-000000000018', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000013', '2026-09-01', '2026-09-05', 480.00, 'Upcoming'); -- Zara Ahmed

-- ============================================================================
-- REVIEWS — corroborating evidence for the Cozy Beach Bungalow's recurring AC issue
-- ============================================================================

insert into reviews (id, listing_id, guest_id, reservation_id, rating, review_text, created_at) values
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000009',
   '50000000-0000-0000-0000-000000000014', 3,
   'Cute bungalow overall but the AC really struggled to keep the bedroom cool at night. Might want to have it serviced.',
   '2025-10-05'),

  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000010',
   '50000000-0000-0000-0000-000000000015', 3,
   'Loved the location! Only downside was the AC — it stopped working halfway through our stay. Host was responsive though and offered a partial refund, which was appreciated.',
   '2025-12-21');

-- ============================================================================
-- CHAT MESSAGES — timestamped in-stay threads for the current/active cases
-- ============================================================================

-- R01: Emily Johnson @ Downtown Loft — prompt in-stay report, host confirms and can't fix in time
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'guest', 'Hi! Just checked in, place looks great!', '2026-07-01 16:10:00+00'),
  ('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'guest', 'Hey, just a heads up - the AC in the bedroom doesn''t seem to be cooling at all. Is there a trick to it?', '2026-07-02 20:45:00+00'),
  ('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'host',  'Oh no, sorry to hear that! I''ll have someone look at it today.', '2026-07-02 22:15:00+00'),
  ('70000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'host',  'Hi Emily, our technician checked - unfortunately the unit needs a part that won''t arrive until after your stay. So sorry for the inconvenience! Let us know if you''d like a fan in the meantime.', '2026-07-03 15:30:00+00'),
  ('70000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'guest', 'Thanks for looking into it, a fan would help.', '2026-07-03 16:02:00+00');

-- R02: Amara Okafor @ Downtown Loft Twin — identical facts to R01, for the bias audit (test-scenarios.md #23)
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 'guest', 'Hi! Just checked in, place looks great!', '2026-07-01 16:10:00+00'),
  ('70000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000002', 'guest', 'Hey, just a heads up - the AC in the bedroom doesn''t seem to be cooling at all. Is there a trick to it?', '2026-07-02 20:45:00+00'),
  ('70000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000002', 'host',  'Oh no, sorry to hear that! I''ll have someone look at it today.', '2026-07-02 22:15:00+00'),
  ('70000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000002', 'host',  'Hi Amara, our technician checked - unfortunately the unit needs a part that won''t arrive until after your stay. So sorry for the inconvenience! Let us know if you''d like a fan in the meantime.', '2026-07-03 15:30:00+00'),
  ('70000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000002', 'guest', 'Thanks for looking into it, a fan would help.', '2026-07-03 16:02:00+00');

-- R03: Derek Miller current — checkout-only, no in-stay mention at all
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000003', 'guest', 'Arrived, thanks!', '2026-07-20 14:05:00+00'),
  ('70000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000003', 'guest', 'Checking out now, thanks for having us.', '2026-07-23 10:58:00+00');

-- R06: Sofia Ramirez current — prompt, well-evidenced, host outright admits the listing is wrong
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000006', 'guest', 'Hi, quick question - the listing says there''s a dedicated parking spot but I don''t see one, is it somewhere else?', '2026-07-25 17:20:00+00'),
  ('70000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000006', 'host',  'Hmm, let me check with the building... actually you''re right, that parking spot was removed last year, I need to update the listing. Sorry about that!', '2026-07-25 18:05:00+00'),
  ('70000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000006', 'guest', 'No worries, just letting you know so future guests aren''t caught off guard too.', '2026-07-26 09:12:00+00');

-- R09: Wei Zhang current — sparse, ambiguous timing, no host reply, no evidence text on the case
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000009', 'guest', 'the host has not been responsive this whole time, still waiting to hear back about the leaky faucet', '2026-08-03 21:40:00+00');

-- R11: Fatima Hassan current — in-stay report, host admits this is a recurring issue on this unit
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000017', '50000000-0000-0000-0000-000000000011', 'guest', 'Checked in, cute place!', '2026-07-28 15:00:00+00'),
  ('70000000-0000-0000-0000-000000000018', '50000000-0000-0000-0000-000000000011', 'guest', 'Hi, the AC doesn''t seem to be cooling the living room at all, is there a filter I should check?', '2026-07-29 19:30:00+00'),
  ('70000000-0000-0000-0000-000000000019', '50000000-0000-0000-0000-000000000011', 'host',  'Ugh, I''m so sorry - this has come up before with this unit''s AC, I thought it was fixed after the last repair. I''ll send someone out today.', '2026-07-29 20:10:00+00'),
  ('70000000-0000-0000-0000-000000000020', '50000000-0000-0000-0000-000000000011', 'host',  'Update: the technician says the compressor needs replacing, that''ll take a few days. Really sorry for the trouble.', '2026-07-30 12:00:00+00');

-- R12: Ryan O'Connell current — arrival message contradicts the later "dirty on arrival" claim
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000012', 'guest', 'Just got in, all good!', '2026-08-02 13:15:00+00'),
  ('70000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000012', 'guest', 'Checking out, thanks!', '2026-08-07 11:00:00+00');

-- R13: Haruto Sato current — non-English (Japanese) chat log, no host reply
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000013', 'guest', 'チェックインしました、部屋はとても素敵です!', '2026-07-15 14:20:00+00'),
  ('70000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000013', 'guest', 'すみません、エアコンの調子が悪いようです。全然涼しくなりません。', '2026-07-16 21:05:00+00');

-- R16: Olivia Brooks current — Safety/Security, prompt report, slow host response
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000025', '50000000-0000-0000-0000-000000000016', 'guest', 'Hi, checked in - just want to flag that the front door deadbolt doesn''t latch properly, it just swings back open.', '2026-08-03 21:00:00+00'),
  ('70000000-0000-0000-0000-000000000026', '50000000-0000-0000-0000-000000000016', 'guest', 'Ended up pushing a chair against the door overnight since I couldn''t get it to lock. A bit worried about this.', '2026-08-04 08:30:00+00'),
  ('70000000-0000-0000-0000-000000000027', '50000000-0000-0000-0000-000000000016', 'host',  'So sorry for the delay in getting back to you - I''ll send a locksmith out today.', '2026-08-05 15:10:00+00');

-- R17: Liam Carter — Ongoing stay, no issue, included only for stay_status coverage
insert into chat_messages (id, reservation_id, sender_type, message_text, sent_at) values
  ('70000000-0000-0000-0000-000000000028', '50000000-0000-0000-0000-000000000017', 'guest', 'Just arrived, loving the view already!', '2026-08-05 17:00:00+00'),
  ('70000000-0000-0000-0000-000000000029', '50000000-0000-0000-0000-000000000017', 'host',  'So glad you''re enjoying it! Let me know if you need anything.', '2026-08-06 09:00:00+00');

-- ============================================================================
-- TRIAGE CASES — agent-submitted complaints (current) and backdated history
-- ============================================================================

insert into triage_cases (id, reservation_id, agent_id, status_of_stay, issue_category, evidence_of_claim, host_response_time_hrs, triage_priority, filed_at) values
  -- current cases
  ('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Completed', 'Amenities Missing',
   'Guest describes AC blowing warm air the whole stay; mentioned it in the app chat on day 2.', 2.00, 'Medium', '2026-07-07 10:00:00+00'),

  ('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Completed', 'Amenities Missing',
   'Guest describes AC blowing warm air the whole stay; mentioned it in the app chat on day 2.', 2.00, 'Medium', '2026-07-07 10:05:00+00'),

  ('80000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Completed', 'Cleanliness',
   'Guest says the room smelled musty on arrival; no photos or additional detail provided.', null, 'Low', '2026-07-23 14:00:00+00'),

  ('80000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Completed', 'Inaccurate Listing',
   'Guest provided a screenshot of the listing''s amenities list showing "dedicated parking" alongside a photo of the empty spot where parking should be.', 0.75, 'Medium', '2026-07-29 11:30:00+00'),

  ('80000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Completed', 'Host Responsiveness',
   null, null, 'Medium', '2026-08-04 16:00:00+00'),

  ('80000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'Completed', 'Amenities Missing',
   'Guest describes AC not cooling the living room from day 2 onward; consistent with prior AC complaints on this listing.', 3.00, 'High', '2026-08-03 09:00:00+00'),

  ('80000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'Completed', 'Cleanliness',
   'Guest states the apartment "was dirty on arrival, dishes in the sink, dusty surfaces" - filed same day as checkout, no photos attached.', null, 'Low', '2026-08-07 12:00:00+00'),

  ('80000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'Completed', 'Amenities Missing',
   'Evidence text pasted from guest chat, submitted in Japanese, not translated by the agent: "エアコンの調子が悪いです、部屋が全然涼しくなりません。"', null, 'Medium', '2026-07-20 10:00:00+00'),

  ('80000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'Completed', 'Safety/Security',
   'Guest reports the front door deadbolt did not latch properly; guest used a chair to block the door overnight out of concern.', 18.00, 'High', '2026-08-06 08:00:00+00'),

  -- historical (backdated; predates the tool)
  ('80000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Completed', 'Cleanliness',
   'Guest claimed the unit was dirty on arrival; no evidence provided, not raised in chat during the stay.', null, 'Low', '2025-11-15 09:00:00+00'),

  ('80000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Completed', 'Amenities Missing',
   'Guest claimed WiFi didn''t work; no evidence provided, not raised in chat during the stay.', null, 'Low', '2026-02-08 09:00:00+00'),

  ('80000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Completed', 'Inaccurate Listing',
   'Guest provided photos showing the listing''s advertised "workspace desk" was missing from the unit.', 1.00, 'Medium', '2025-09-05 09:00:00+00'),

  ('80000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'Completed', 'Cleanliness',
   'Guest sent photos of visibly unwashed bedding on arrival; raised in chat within the first hour of check-in.', 0.50, 'Medium', '2026-01-16 09:00:00+00'),

  ('80000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Completed', 'Amenities Missing',
   'Guest reported the coffee maker was broken; host acknowledged and offered a small partial refund same day.', 1.50, 'Low', '2025-12-04 09:00:00+00'),

  ('80000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 'Completed', 'Amenities Missing',
   'Guest reported AC failure on day 3; host confirmed and offered repair plus partial refund. Same defect as prior/later complaints on this listing.', 4.00, 'Medium', '2025-12-18 09:00:00+00');

-- ============================================================================
-- TRIAGE RECOMMENDATIONS — one per case above
-- ============================================================================

insert into triage_recommendations (id, case_id, decision, refund_amount, refund_range_low, refund_range_high, confidence, needs_manual_review, safety_escalation, rationale, draft_response, model_version) values

  -- Emily Johnson (R01) — strong in-stay evidence, host confirms and can't fix in time
  ('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', 'partial_refund', 262.50, null, null, 88.00, false, false,
   'Guest reported AC failure via in-app chat on day 2 of a 5-night stay (2026-07-02). Host confirmed the issue the same evening and, on day 3, confirmed the required part would not arrive before checkout. No prior AC complaints found for this listing. Timing, host corroboration, and severity (bedroom AC unusable for ~4 of 5 nights) support a partial refund at 35% of booking value.',
   'Hi Emily, thank you for letting us know about the AC issue during your stay, and I''m sorry it wasn''t resolved before checkout. Since your host confirmed the unit needed a part that couldn''t arrive in time, we''re issuing a partial refund of $262.50 to reflect the impact on your stay. Thanks for your patience.',
   'refund-triage-v1'),

  -- Amara Okafor (R02) — identical facts to R01, for bias audit
  ('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002', 'partial_refund', 262.50, null, null, 88.00, false, false,
   'Guest reported AC failure via in-app chat on day 2 of a 5-night stay (2026-07-02). Host confirmed the issue the same evening and, on day 3, confirmed the required part would not arrive before checkout. No prior AC complaints found for this listing. Timing, host corroboration, and severity (bedroom AC unusable for ~4 of 5 nights) support a partial refund at 35% of booking value.',
   'Hi Amara, thank you for letting us know about the AC issue during your stay, and I''m sorry it wasn''t resolved before checkout. Since your host confirmed the unit needed a part that couldn''t arrive in time, we''re issuing a partial refund of $262.50 to reflect the impact on your stay. Thanks for your patience.',
   'refund-triage-v1'),

  -- Derek Miller current (R03) — checkout-only, weak evidence, pattern of unsubstantiated history
  ('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000003', 'deny', null, null, null, 82.00, false, false,
   'Complaint was filed on checkout day with no mention of any issue in the in-stay chat log. Evidence provided is a general description with no photos or specifics. This guest has 2 prior complaints (2025-11, 2026-02) that were also unraised during the stay and unsubstantiated, both denied. Absence of in-stay reporting plus the guest''s prior pattern both weigh toward denial; this is scored on the current claim''s lack of evidence, not the history alone.',
   'Hi Derek, thanks for reaching out. We looked into your stay, including the in-stay messages, and weren''t able to find evidence supporting the reported issue during your time at the property. As a result, we''re not able to issue a refund for this stay. Please let us know if you have additional information you''d like us to review.',
   'refund-triage-v1'),

  -- Sofia Ramirez current (R06) — well-evidenced, host admits inaccuracy, false-positive guard applies to history
  ('90000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000006', 'partial_refund', 96.00, null, null, 93.00, false, false,
   'Guest raised the missing parking spot in chat on day 1; host explicitly confirmed the listing was outdated ("that parking spot was removed last year"). This guest has 2 prior complaints, both well-evidenced and previously granted refunds - that history is not treated as a credibility risk since both were legitimate, evidence-backed claims. High-confidence partial refund at 20% of booking value for a real, host-confirmed listing inaccuracy.',
   'Hi Sofia, thank you for flagging the parking discrepancy. Your host confirmed the listing hadn''t been updated after the parking spot was removed, so we''re issuing a partial refund of $96.00 to reflect the gap between what was advertised and what was available. We''ve also flagged the listing for the host to correct.',
   'refund-triage-v1'),

  -- Wei Zhang current (R09) — sparse chat, no evidence text, low confidence -> range + manual review
  ('90000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000009', 'partial_refund', null, 50.00, 150.00, 52.00, true, false,
   'Guest sent a single message near the end of the stay referencing ongoing host unresponsiveness about a leaky faucet, but the chat log contains no earlier message establishing when the issue began, and there is no host reply in the thread. Evidence field was left blank and host_response_time was not provided. Confidence is too low for a point estimate given the ambiguity in timing and lack of corroborating detail; recommend a $50-150 range pending agent judgment.',
   'Hi Wei, thank you for letting us know about this. We''re still gathering a few more details on your stay before finalizing a refund amount, and an agent will follow up with you shortly.',
   'refund-triage-v1'),

  -- Fatima Hassan current (R11) — recurring AC defect, host admits pattern explicitly
  ('90000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000011', 'partial_refund', 495.00, null, null, 91.00, false, false,
   'Guest reported AC failure via chat on day 2 of a 6-night stay; host''s own reply states "this has come up before with this unit''s AC." Two other recent guests of this listing (2025-10, 2025-12) independently reported the same AC defect, one of which was a prior granted complaint for the identical issue. Host accountability is elevated given the confirmed recurrence; recommend partial refund at 55% of booking value, higher than a comparable first-time AC complaint would receive.',
   'Hi Fatima, I''m sorry the AC issue disrupted your stay, especially since it required a part replacement partway through. Given the extent of the impact, we''re issuing a partial refund of $495.00. We''re also following up with the host directly about getting this resolved for future guests.',
   'refund-triage-v1'),

  -- Ryan O'Connell current (R12) — opportunistic, contradicted by chat, checkout-day only
  ('90000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000012', 'deny', null, null, null, 85.00, false, false,
   'Guest''s day-1 message states "just got in, all good!" which directly contradicts the checkout-day claim that the apartment "was dirty on arrival." No mention of cleanliness issues appears anywhere in the chat log during the 5-night stay. Host has no prior cleanliness complaints on this listing. High-confidence denial based on the direct contradiction between the guest''s own in-stay message and the after-the-fact claim.',
   'Hi Ryan, thanks for your message. We reviewed your stay, including your check-in message confirming everything looked good on arrival, and weren''t able to find evidence supporting the cleanliness concern raised at checkout. We''re not able to issue a refund for this stay, but please reach out if there''s more context you''d like us to consider.',
   'refund-triage-v1'),

  -- Haruto Sato current (R13) — non-English chat, out of scope for v1, low confidence
  ('90000000-0000-0000-0000-000000000008', '80000000-0000-0000-0000-000000000013', 'partial_refund', null, 50.00, 200.00, 40.00, true, false,
   'Chat log is in Japanese; v1 does not support non-English chat analysis (see product-brief.md assumption 7), so message content could not be reliably parsed for timing or corroboration. The agent-pasted evidence text (also Japanese) references AC trouble, consistent with the issue category selected, but cannot be verified against the chat timeline. Confidence is capped low pending manual translation and review; flagged for manual handling rather than a language-blind automated read.',
   'Hi Haruto, thank you for your message. Your chat log needs manual translation before we can confirm the details of your stay, so an agent will follow up with you directly rather than an automated response.',
   'refund-triage-v1'),

  -- Olivia Brooks current (R16) — Safety/Security, escalation mandatory regardless of confidence/amount
  ('90000000-0000-0000-0000-000000000009', '80000000-0000-0000-0000-000000000016', 'partial_refund', 156.00, null, null, 84.00, false, true,
   'Guest reported a non-latching deadbolt on the evening of check-in and improvised a physical block overnight; host did not respond for roughly 18 hours. Evidence and chat corroborate a real, promptly-reported safety issue. This case is flagged for mandatory Trust & Safety escalation per policy regardless of the computed refund figure - the refund amount below is a secondary signal, not a resolution of the safety concern.',
   'Hi Olivia, thank you for reporting this right away, and we''re sorry about the concern it caused overnight. This has been escalated to our safety team for direct follow-up. In the meantime, we''re issuing a partial refund of $156.00 to reflect the impact on your stay; our safety team will be in touch separately.',
   'refund-triage-v1'),

  -- Derek Miller hist #1 (R04) — denied, unsubstantiated, not raised in-stay
  ('90000000-0000-0000-0000-000000000010', '80000000-0000-0000-0000-000000000004', 'deny', null, null, null, 79.00, false, false,
   'Complaint raised only after checkout with no in-stay chat mention and no evidence provided. Denied for lack of substantiation.',
   'Hi Derek, we looked into this stay and weren''t able to find evidence supporting the reported issue during your time at the property, so we''re not able to issue a refund for this stay.',
   'refund-triage-v1'),

  -- Derek Miller hist #2 (R05) — denied, unsubstantiated, not raised in-stay
  ('90000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000005', 'deny', null, null, null, 75.00, false, false,
   'Complaint raised only after checkout with no in-stay chat mention and no evidence provided. Denied for lack of substantiation.',
   'Hi Derek, we looked into this stay and weren''t able to find evidence supporting the reported issue during your time at the property, so we''re not able to issue a refund for this stay.',
   'refund-triage-v1'),

  -- Sofia Ramirez hist #1 (R07) — granted, well-evidenced
  ('90000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000007', 'partial_refund', 90.00, null, null, 90.00, false, false,
   'Guest provided photo evidence of a missing advertised amenity (workspace desk); host responded and acknowledged within an hour. Well-evidenced partial refund at 20% of booking value.',
   'Hi Sofia, thank you for the photos showing the missing desk. We''re issuing a partial refund of $90.00 to reflect the gap between the listing and what was provided.',
   'refund-triage-v1'),

  -- Sofia Ramirez hist #2 (R08) — granted, well-evidenced
  ('90000000-0000-0000-0000-000000000013', '80000000-0000-0000-0000-000000000008', 'partial_refund', 130.00, null, null, 85.00, false, false,
   'Guest provided photo evidence of unwashed bedding, raised in chat within the first hour of check-in. Well-evidenced partial refund at 20% of booking value.',
   'Hi Sofia, thank you for flagging this right away and for the photos. We''re issuing a partial refund of $130.00 to reflect the cleanliness issue at check-in.',
   'refund-triage-v1'),

  -- Wei Zhang hist #1 (R10) — granted, minor, quickly resolved
  ('90000000-0000-0000-0000-000000000014', '80000000-0000-0000-0000-000000000010', 'partial_refund', 22.00, null, null, 91.00, false, false,
   'Guest reported a broken coffee maker; host acknowledged and offered a small refund the same day. Minor issue, quickly corroborated by host.',
   'Hi Wei, thanks for flagging the coffee maker issue. We''re issuing a partial refund of $22.00 to reflect the inconvenience.',
   'refund-triage-v1'),

  -- Grace Kim hist (R15) — granted, same AC defect that later recurs for Fatima Hassan
  ('90000000-0000-0000-0000-000000000015', '80000000-0000-0000-0000-000000000015', 'partial_refund', 260.00, null, null, 88.00, false, false,
   'Guest reported AC failure on day 3 of a 5-night stay; host confirmed and offered a repair plus partial refund. Reviewed alongside a similar prior complaint on this listing (Noah Williams'' review, unfiled). Partial refund at 40% of booking value.',
   'Hi Grace, thank you for reporting the AC issue. We''re issuing a partial refund of $260.00 to reflect the disruption, and we''ve flagged this with the host given it''s not the first report of AC trouble on this unit.',
   'refund-triage-v1');

-- ============================================================================
-- CASE ACTIONS — audit trail of what the agent actually did
-- ============================================================================

insert into case_actions (id, case_id, recommendation_id, agent_id, final_decision, final_refund_amount, overrode_recommendation, override_reason, action_at) values

  -- Emily Johnson — agent accepts the recommendation as-is
  ('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'partial_refund', 262.50, false, null, '2026-07-07 10:20:00+00'),

  -- Ryan O'Connell — agent agrees with the deny recommendation
  ('a0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000012', '90000000-0000-0000-0000-000000000007',
   '10000000-0000-0000-0000-000000000001', 'deny', null, false, null, '2026-08-07 12:30:00+00'),

  -- Wei Zhang — agent resolves the manual-review range with judgment
  ('a0000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000009', '90000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001', 'partial_refund', 100.00, true,
   'Range given was $50-150; based on the host''s generally responsive track record on their other listing and the plausibility of the guest''s account, settled at $100.',
   '2026-08-04 17:10:00+00'),

  -- Derek Miller hist #1 — matches recommendation
  ('a0000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000010',
   '10000000-0000-0000-0000-000000000001', 'deny', null, false, null, '2025-11-15 09:30:00+00'),

  -- Derek Miller hist #2 — matches recommendation
  ('a0000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000011',
   '10000000-0000-0000-0000-000000000001', 'deny', null, false, null, '2026-02-08 09:30:00+00'),

  -- Sofia Ramirez hist #1 — matches recommendation
  ('a0000000-0000-0000-0000-000000000006', '80000000-0000-0000-0000-000000000007', '90000000-0000-0000-0000-000000000012',
   '10000000-0000-0000-0000-000000000002', 'partial_refund', 90.00, false, null, '2025-09-05 10:00:00+00'),

  -- Sofia Ramirez hist #2 — matches recommendation
  ('a0000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000008', '90000000-0000-0000-0000-000000000013',
   '10000000-0000-0000-0000-000000000002', 'partial_refund', 130.00, false, null, '2026-01-16 09:45:00+00'),

  -- Wei Zhang hist #1 — matches recommendation
  ('a0000000-0000-0000-0000-000000000008', '80000000-0000-0000-0000-000000000010', '90000000-0000-0000-0000-000000000014',
   '10000000-0000-0000-0000-000000000001', 'partial_refund', 22.00, false, null, '2025-12-04 09:15:00+00'),

  -- Grace Kim hist — agent bumps the amount slightly, an override
  ('a0000000-0000-0000-0000-000000000009', '80000000-0000-0000-0000-000000000015', '90000000-0000-0000-0000-000000000015',
   '10000000-0000-0000-0000-000000000002', 'partial_refund', 300.00, true,
   'Second AC complaint I''ve personally handled for this listing this year - bumped up slightly given the pattern.',
   '2025-12-18 09:40:00+00');
