// Local dev fixtures, used only when SUPABASE_* env vars are absent (see ../config.ts).
// A representative subset of ../../seed-data.sql — not a full port. Booking IDs here are
// human-typeable on purpose so the golden path is easy to demo without a real database.

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
    hostHistory: [],
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
    hostHistory: [],
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
    hostHistory: [],
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
    hostHistory: [
      { issueCategory: 'Amenities Missing', decision: 'partial_refund', refundAmount: 260, filedAt: '2025-12-18', listingId: 'listing-beach-bungalow' },
    ],
  },
};
