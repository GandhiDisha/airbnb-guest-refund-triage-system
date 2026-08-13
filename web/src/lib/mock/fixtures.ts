// Local dev fixtures, used only when SUPABASE_* env vars are absent (see ../config.ts).
// A full port of every "current case" in ../../seed-data.sql (historical-only reservations
// like Grace Kim's or Noah Williams' are folded in as guestHistory/hostHistory instead of
// getting their own booking ID). Booking IDs here are human-typeable on purpose so the
// golden path is easy to demo without a real database.
//
// guestHistory/hostHistory below mirror the *unfiltered* scope getCaseBundleSupabase
// actually queries (../data/supabase.ts) — ALL of a guest's past cases across every listing,
// and ALL of a host's past cases across every listing they own, not just cases matching the
// current issue category. The decision engine (../decision-engine.ts) does that filtering
// itself, so trimming history here to "only the entries that look relevant" would silently
// diverge from what Supabase mode computes for the same booking.

import type { CaseBundle } from '../types';

export const MOCK_BOOKINGS: Record<string, CaseBundle> = {
  'EMILY-750': {
    reservation: {
      id: 'res-emily',
      listingId: 'listing-downtown-loft',
      guestId: 'guest-emily',
      hostId: 'host-michael',
      checkInDate: '2026-07-01',
      checkOutDate: '2026-07-06',
      nightsStayed: 5,
      bookingValueUsd: 750,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-emily', name: 'Emily Johnson' },
    host: { id: 'host-michael', name: 'Michael Thompson' },
    listing: {
      id: 'listing-downtown-loft',
      category: 'Entire Property',
      title: 'Downtown Loft with Skyline View',
      description: 'Bright 1-bedroom loft downtown. Central AC, full kitchen, high-speed WiFi, walk to transit.',
      updatedAt: '2026-06-15',
    },
    chatMessages: [
      { senderType: 'guest', messageText: 'Hi! Just checked in, place looks great!', sentAt: '2026-07-01T16:10:00Z' },
      { senderType: 'guest', messageText: "Hey, just a heads up - the AC in the bedroom doesn't seem to be cooling at all. Is there a trick to it?", sentAt: '2026-07-02T20:45:00Z' },
      { senderType: 'host', messageText: "Oh no, sorry to hear that! I'll have someone look at it today.", sentAt: '2026-07-02T22:15:00Z' },
      { senderType: 'host', messageText: "Hi Emily, our technician checked - unfortunately the unit needs a part that won't arrive until after your stay. So sorry for the inconvenience! Let us know if you'd like a fan in the meantime.", sentAt: '2026-07-03T15:30:00Z' },
      { senderType: 'guest', messageText: 'Thanks for looking into it, a fan would help.', sentAt: '2026-07-03T16:02:00Z' },
    ],
    otherReviews: [],
    guestHistory: [],
    // Michael Thompson's only listing is Downtown Loft — these are the other two
    // guests' cases on it (seed reservations 50000000-...0007 and ...0010).
    hostHistory: [
      { issueCategory: 'Inaccurate Listing', decision: 'partial_refund', refundAmount: 90, filedAt: '2025-09-05', listingId: 'listing-downtown-loft' },
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: 22, filedAt: '2025-12-04', listingId: 'listing-downtown-loft' },
    ],
  },

  'AMARA-750': {
    reservation: {
      id: 'res-amara',
      listingId: 'listing-downtown-loft-twin',
      guestId: 'guest-amara',
      hostId: 'host-kwame',
      checkInDate: '2026-07-01',
      checkOutDate: '2026-07-06',
      nightsStayed: 5,
      bookingValueUsd: 750,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-amara', name: 'Amara Okafor' },
    host: { id: 'host-kwame', name: 'Kwame Mensah' },
    listing: {
      id: 'listing-downtown-loft-twin',
      category: 'Entire Property',
      title: 'Downtown Loft with Skyline View — Twin Unit',
      description: 'Bright 1-bedroom loft downtown. Central AC, full kitchen, high-speed WiFi, walk to transit.',
      updatedAt: '2026-06-15',
    },
    // Identical facts to EMILY-750 — bias-pair mirror (test-scenarios.md #23): same issue,
    // same timing, same host behavior, only the guest/host names differ.
    chatMessages: [
      { senderType: 'guest', messageText: 'Hi! Just checked in, place looks great!', sentAt: '2026-07-01T16:10:00Z' },
      { senderType: 'guest', messageText: "Hey, just a heads up - the AC in the bedroom doesn't seem to be cooling at all. Is there a trick to it?", sentAt: '2026-07-02T20:45:00Z' },
      { senderType: 'host', messageText: "Oh no, sorry to hear that! I'll have someone look at it today.", sentAt: '2026-07-02T22:15:00Z' },
      { senderType: 'host', messageText: "Hi Amara, our technician checked - unfortunately the unit needs a part that won't arrive until after your stay. So sorry for the inconvenience! Let us know if you'd like a fan in the meantime.", sentAt: '2026-07-03T15:30:00Z' },
      { senderType: 'guest', messageText: 'Thanks for looking into it, a fan would help.', sentAt: '2026-07-03T16:02:00Z' },
    ],
    otherReviews: [],
    guestHistory: [],
    // Kwame Mensah's only listing is the Twin Unit, with no other history on it —
    // unlike Emily's host, so this pair isn't a perfectly controlled bias test.
    hostHistory: [],
  },

  'DEREK-360': {
    reservation: {
      id: 'res-derek-current',
      listingId: 'listing-modern-studio',
      guestId: 'guest-derek',
      hostId: 'host-carlos',
      checkInDate: '2026-07-20',
      checkOutDate: '2026-07-23',
      nightsStayed: 3,
      bookingValueUsd: 360,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-derek', name: 'Derek Miller' },
    host: { id: 'host-carlos', name: 'Carlos Mendez' },
    listing: {
      id: 'listing-modern-studio',
      category: 'Private Room',
      title: 'Modern Studio near Transit',
      description: 'Private room in a modern studio building. Dedicated parking spot included, shared kitchen, quiet block.',
      updatedAt: '2026-07-01',
    },
    chatMessages: [
      { senderType: 'guest', messageText: 'Arrived, thanks!', sentAt: '2026-07-20T14:05:00Z' },
      { senderType: 'guest', messageText: 'Checking out now, thanks for having us.', sentAt: '2026-07-23T10:58:00Z' },
    ],
    otherReviews: [],
    guestHistory: [
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2025-11-15', listingId: 'listing-sunny-garden' },
      { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2026-02-08', listingId: 'listing-riverside-cottage' },
    ],
    // Carlos Mendez owns Modern Studio and Riverside Cottage — includes Derek's own
    // hist#2 above (it's on Riverside Cottage, one of Carlos's listings) plus Wei's
    // and Haruto's current cases, also on Riverside Cottage.
    hostHistory: [
      { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2026-02-08', listingId: 'listing-riverside-cottage' },
      { issueCategory: 'Host Responsiveness', decision: 'partial_refund', refundAmount: null, filedAt: '2026-08-04', listingId: 'listing-riverside-cottage' },
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: null, filedAt: '2026-07-20', listingId: 'listing-riverside-cottage' },
    ],
  },

  'SOFIA-480': {
    reservation: {
      id: 'res-sofia-current',
      listingId: 'listing-modern-studio',
      guestId: 'guest-sofia',
      hostId: 'host-carlos',
      checkInDate: '2026-07-25',
      checkOutDate: '2026-07-29',
      nightsStayed: 4,
      bookingValueUsd: 480,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-sofia', name: 'Sofia Ramirez' },
    host: { id: 'host-carlos', name: 'Carlos Mendez' },
    listing: {
      id: 'listing-modern-studio',
      category: 'Private Room',
      title: 'Modern Studio near Transit',
      description: 'Private room in a modern studio building. Dedicated parking spot included, shared kitchen, quiet block.',
      updatedAt: '2026-07-01',
    },
    // Well-evidenced, host outright admits the listing is wrong — tests the false-positive
    // guard (test-scenarios.md): Sofia has 2 past complaints, but both were legitimate and
    // granted, so guestCredibilityMultiplier must stay at 1.0, not be penalized.
    chatMessages: [
      { senderType: 'guest', messageText: "Hi, quick question - the listing says there's a dedicated parking spot but I don't see one, is it somewhere else?", sentAt: '2026-07-25T17:20:00Z' },
      { senderType: 'host', messageText: "Hmm, let me check with the building... actually you're right, that parking spot was removed last year, I need to update the listing. Sorry about that!", sentAt: '2026-07-25T18:05:00Z' },
      { senderType: 'guest', messageText: "No worries, just letting you know so future guests aren't caught off guard too.", sentAt: '2026-07-26T09:12:00Z' },
    ],
    otherReviews: [],
    guestHistory: [
      { issueCategory: 'Inaccurate Listing', decision: 'partial_refund', refundAmount: 90, filedAt: '2025-09-05', listingId: 'listing-downtown-loft' },
      { issueCategory: 'Cleanliness', decision: 'partial_refund', refundAmount: 130, filedAt: '2026-01-16', listingId: 'listing-beach-bungalow' },
    ],
    // Carlos Mendez owns Modern Studio and Riverside Cottage.
    hostHistory: [
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2026-07-23', listingId: 'listing-modern-studio' },
      { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2026-02-08', listingId: 'listing-riverside-cottage' },
      { issueCategory: 'Host Responsiveness', decision: 'partial_refund', refundAmount: null, filedAt: '2026-08-04', listingId: 'listing-riverside-cottage' },
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: null, filedAt: '2026-07-20', listingId: 'listing-riverside-cottage' },
    ],
  },

  'WEI-330': {
    reservation: {
      id: 'res-wei',
      listingId: 'listing-riverside-cottage',
      guestId: 'guest-wei',
      hostId: 'host-carlos',
      checkInDate: '2026-08-01',
      checkOutDate: '2026-08-04',
      nightsStayed: 3,
      bookingValueUsd: 330,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-wei', name: 'Wei Zhang' },
    host: { id: 'host-carlos', name: 'Carlos Mendez' },
    listing: {
      id: 'listing-riverside-cottage',
      category: 'Entire Property',
      title: 'Riverside Cottage',
      description: 'Quiet 1-bedroom cottage on the river. AC unit in bedroom, small dock access, pet-friendly.',
      updatedAt: '2026-05-01',
    },
    chatMessages: [
      { senderType: 'guest', messageText: 'the host has not been responsive this whole time, still waiting to hear back about the leaky faucet', sentAt: '2026-08-03T21:40:00Z' },
    ],
    otherReviews: [],
    guestHistory: [
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: 22, filedAt: '2025-12-04', listingId: 'listing-downtown-loft' },
    ],
    // Carlos Mendez owns Modern Studio and Riverside Cottage.
    hostHistory: [
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2026-07-23', listingId: 'listing-modern-studio' },
      { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2026-02-08', listingId: 'listing-riverside-cottage' },
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: null, filedAt: '2026-07-20', listingId: 'listing-riverside-cottage' },
    ],
  },

  'RYAN-600': {
    reservation: {
      id: 'res-ryan',
      listingId: 'listing-sunny-garden',
      guestId: 'guest-ryan',
      hostId: 'host-priya',
      checkInDate: '2026-08-02',
      checkOutDate: '2026-08-07',
      nightsStayed: 5,
      bookingValueUsd: 600,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-ryan', name: "Ryan O'Connell" },
    host: { id: 'host-priya', name: 'Priya Nair' },
    listing: {
      id: 'listing-sunny-garden',
      category: 'Entire Property',
      title: 'Sunny Garden Apartment',
      description: 'Ground-floor 1-bedroom with a private garden entrance. Freshly cleaned between every stay, close to shops.',
      updatedAt: '2026-07-20',
    },
    // Day-1 "all good!" message directly contradicts the checkout-day cleanliness claim —
    // tests the opportunistic/contradicted-by-chat deny path, independent of history.
    chatMessages: [
      { senderType: 'guest', messageText: 'Just got in, all good!', sentAt: '2026-08-02T13:15:00Z' },
      { senderType: 'guest', messageText: 'Checking out, thanks!', sentAt: '2026-08-07T11:00:00Z' },
    ],
    otherReviews: [],
    guestHistory: [],
    // Priya Nair's only listing is Sunny Garden — includes Derek's denied Cleanliness
    // case on the same listing (same category as Ryan's claim) and Olivia's current case.
    hostHistory: [
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2025-11-15', listingId: 'listing-sunny-garden' },
      { issueCategory: 'Safety/Security', decision: 'partial_refund', refundAmount: 156, filedAt: '2026-08-06', listingId: 'listing-sunny-garden' },
    ],
  },

  'HARUTO-500': {
    reservation: {
      id: 'res-haruto',
      listingId: 'listing-riverside-cottage',
      guestId: 'guest-haruto',
      hostId: 'host-carlos',
      checkInDate: '2026-07-15',
      checkOutDate: '2026-07-19',
      nightsStayed: 4,
      bookingValueUsd: 500,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-haruto', name: 'Haruto Sato' },
    host: { id: 'host-carlos', name: 'Carlos Mendez' },
    listing: {
      id: 'listing-riverside-cottage',
      category: 'Entire Property',
      title: 'Riverside Cottage',
      description: 'Quiet 1-bedroom cottage on the river. AC unit in bedroom, small dock access, pet-friendly.',
      updatedAt: '2026-05-01',
    },
    // Non-English (Japanese) chat, no host reply — tests detectNonEnglish() confidence cap
    // (decision-engine.ts caps confidence at 40 and routes to manual review).
    chatMessages: [
      { senderType: 'guest', messageText: 'チェックインしました、部屋はとても素敵です!', sentAt: '2026-07-15T14:20:00Z' },
      { senderType: 'guest', messageText: 'すみません、エアコンの調子が悪いようです。全然涼しくなりません。', sentAt: '2026-07-16T21:05:00Z' },
    ],
    otherReviews: [],
    guestHistory: [],
    // Carlos Mendez owns Modern Studio and Riverside Cottage — includes Derek's hist#2
    // (Amenities Missing on this same listing) and Wei's current case.
    hostHistory: [
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2026-07-23', listingId: 'listing-modern-studio' },
      { issueCategory: 'Amenities Missing', decision: 'deny', refundAmount: null, filedAt: '2026-02-08', listingId: 'listing-riverside-cottage' },
      { issueCategory: 'Host Responsiveness', decision: 'partial_refund', refundAmount: null, filedAt: '2026-08-04', listingId: 'listing-riverside-cottage' },
    ],
  },

  'OLIVIA-390': {
    reservation: {
      id: 'res-olivia',
      listingId: 'listing-sunny-garden',
      guestId: 'guest-olivia',
      hostId: 'host-priya',
      checkInDate: '2026-08-03',
      checkOutDate: '2026-08-06',
      nightsStayed: 3,
      bookingValueUsd: 390,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-olivia', name: 'Olivia Brooks' },
    host: { id: 'host-priya', name: 'Priya Nair' },
    listing: {
      id: 'listing-sunny-garden',
      category: 'Entire Property',
      title: 'Sunny Garden Apartment',
      description: 'Ground-floor 1-bedroom with a private garden entrance. Freshly cleaned between every stay, close to shops.',
      updatedAt: '2026-07-20',
    },
    chatMessages: [
      { senderType: 'guest', messageText: "Hi, checked in - just want to flag that the front door deadbolt doesn't latch properly, it just swings back open.", sentAt: '2026-08-03T21:00:00Z' },
      { senderType: 'guest', messageText: "Ended up pushing a chair against the door overnight since I couldn't get it to lock. A bit worried about this.", sentAt: '2026-08-04T08:30:00Z' },
      { senderType: 'host', messageText: "So sorry for the delay in getting back to you - I'll send a locksmith out today.", sentAt: '2026-08-05T15:10:00Z' },
    ],
    otherReviews: [],
    guestHistory: [],
    // Priya Nair's only listing is Sunny Garden — includes Derek's denied Cleanliness
    // case and Ryan's denied Cleanliness case, both on the same listing.
    hostHistory: [
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2025-11-15', listingId: 'listing-sunny-garden' },
      { issueCategory: 'Cleanliness', decision: 'deny', refundAmount: null, filedAt: '2026-08-07', listingId: 'listing-sunny-garden' },
    ],
  },

  'FATIMA-900': {
    reservation: {
      id: 'res-fatima',
      listingId: 'listing-beach-bungalow',
      guestId: 'guest-fatima',
      hostId: 'host-diane',
      checkInDate: '2026-07-28',
      checkOutDate: '2026-08-03',
      nightsStayed: 6,
      bookingValueUsd: 900,
      stayStatus: 'Completed',
    },
    guest: { id: 'guest-fatima', name: 'Fatima Hassan' },
    host: { id: 'host-diane', name: 'Diane Walsh' },
    listing: {
      id: 'listing-beach-bungalow',
      category: 'Entire Property',
      title: 'Cozy Beach Bungalow',
      description: 'Charming 2-bedroom bungalow 5 min from the beach. Reliable central AC, private patio, beach gear provided.',
      updatedAt: '2025-05-20',
    },
    chatMessages: [
      { senderType: 'guest', messageText: 'Checked in, cute place!', sentAt: '2026-07-28T15:00:00Z' },
      { senderType: 'guest', messageText: "Hi, the AC doesn't seem to be cooling the living room at all, is there a filter I should check?", sentAt: '2026-07-29T19:30:00Z' },
      { senderType: 'host', messageText: "Ugh, I'm so sorry - this has come up before with this unit's AC, I thought it was fixed after the last repair. I'll send someone out today.", sentAt: '2026-07-29T20:10:00Z' },
      { senderType: 'host', messageText: "Update: the technician says the compressor needs replacing, that'll take a few days. Really sorry for the trouble.", sentAt: '2026-07-30T12:00:00Z' },
    ],
    otherReviews: [
      { rating: 3, reviewText: 'Cute bungalow overall but the AC really struggled to keep the bedroom cool at night. Might want to have it serviced.', createdAt: '2025-10-05' },
      { rating: 3, reviewText: 'Loved the location! Only downside was the AC - it stopped working halfway through our stay. Host was responsive though and offered a partial refund, which was appreciated.', createdAt: '2025-12-21' },
    ],
    guestHistory: [],
    // Diane Walsh's only listing is Cozy Beach Bungalow — includes Sofia's granted
    // Cleanliness case and Grace Kim's granted Amenities Missing case (the recurring
    // AC defect this case itself is about), both on the same listing.
    hostHistory: [
      { issueCategory: 'Cleanliness', decision: 'partial_refund', refundAmount: 130, filedAt: '2026-01-16', listingId: 'listing-beach-bungalow' },
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: 260, filedAt: '2025-12-18', listingId: 'listing-beach-bungalow' },
    ],
  },
};
