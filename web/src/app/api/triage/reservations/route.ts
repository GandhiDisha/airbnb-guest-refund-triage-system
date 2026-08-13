import { NextResponse } from 'next/server';
import { listReservations } from '@/lib/data';

export async function GET() {
  const reservations = await listReservations();
  return NextResponse.json(reservations);
}
