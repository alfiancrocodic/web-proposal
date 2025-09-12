import { NextResponse } from 'next/server';
import { readDb, writeDb, uid, nowIso } from '@/lib/db';

export async function GET(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const list = db.proposals.filter(pr => pr.projectId === id).sort((a,b) => b.version - a.version);
  return NextResponse.json(list);
}

export async function POST(req, { params }) {
  const { id } = await params;
  const db = readDb();
  const existing = db.proposals.filter(pr => pr.projectId === id);
  const maxVersion = existing.reduce((m, pr) => Math.max(m, pr.version), 0);
  const proposal = {
    id: uid('pr'),
    projectId: id,
    version: maxVersion + 1,
    createdAt: nowIso(),
  };
  db.proposals.push(proposal);
  writeDb(db);
  return NextResponse.json(proposal, { status: 201 });
}
