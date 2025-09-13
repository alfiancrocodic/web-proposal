import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const pr = db.proposals.find(p => p.id === id);
  if (!pr) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(pr);
}

