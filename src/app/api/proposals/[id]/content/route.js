import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const entry = (db.proposalContents || []).find(pc => pc.proposalId === id);
  if (!entry) return NextResponse.json({ systemEnvironment: { platforms: [], notes: '' }, featureSales: [], featureAdmin: [], financialBreakdown: [], termsOfPayment: [], termsAndConditions: [] });
  return NextResponse.json(entry.data || {});
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const db = readDb();
  if (!db.proposalContents) db.proposalContents = [];
  const idx = db.proposalContents.findIndex(pc => pc.proposalId === id);
  if (idx === -1) db.proposalContents.push({ proposalId: id, data: body });
  else db.proposalContents[idx].data = body;
  writeDb(db);
  return NextResponse.json({ ok: true });
}

