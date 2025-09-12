import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const project = db.projects.find(p => p.id === id);
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req, { params }) {
  const body = await req.json();
  const { id } = await params;
  const db = readDb();
  const idx = db.projects.findIndex(p => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.projects[idx] = { ...db.projects[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.projects[idx]);
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const before = db.projects.length;
  db.projects = db.projects.filter(p => p.id !== id);
  if (db.projects.length === before) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.proposals = db.proposals.filter(pr => pr.projectId !== id);
  writeDb(db);
  return NextResponse.json({ ok: true });
}
