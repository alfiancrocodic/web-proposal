import { NextResponse } from 'next/server';
import { readDb, writeDb, uid, nowIso } from '@/lib/db';

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.clients);
}

export async function POST(req) {
  const body = await req.json();
  if (!body.company) return NextResponse.json({ error: 'company required' }, { status: 400 });
  const db = readDb();
  const client = {
    id: uid('c'),
    company: body.company,
    location: body.location || '',
    badanUsaha: body.badanUsaha || '',
    picName: body.picName || '',
    position: body.position || '',
    createdAt: nowIso(),
  };
  db.clients.push(client);
  writeDb(db);
  return NextResponse.json(client, { status: 201 });
}

