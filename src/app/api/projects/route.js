import { NextResponse } from 'next/server';
import { readDb, writeDb, uid, nowIso } from '@/lib/db';

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.projects);
}

export async function POST(req) {
  const body = await req.json();
  if (!body.clientId || !body.name) return NextResponse.json({ error: 'clientId and name required' }, { status: 400 });
  const db = readDb();
  const project = {
    id: uid('p'),
    clientId: body.clientId,
    name: body.name,
    analyst: body.analyst || '',
    grade: body.grade || 'A',
    roles: Array.isArray(body.roles) ? body.roles : [],
    createdAt: nowIso(),
  };
  db.projects.push(project);
  writeDb(db);
  return NextResponse.json(project, { status: 201 });
}

