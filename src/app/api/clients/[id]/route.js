import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const client = db.clients.find(c => c.id === id);
  if (!client) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req, { params }) {
  const body = await req.json();
  const { id } = await params;
  const db = readDb();
  const idx = db.clients.findIndex(c => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.clients[idx] = { ...db.clients[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.clients[idx]);
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const db = readDb();
  const before = db.clients.length;
  db.clients = db.clients.filter(c => c.id !== id);
  if (db.clients.length === before) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Also delete projects and proposals tied to this client
  const clientProjects = db.projects.filter(p => p.clientId === id).map(p => p.id);
  db.projects = db.projects.filter(p => p.clientId !== id);
  db.proposals = db.proposals.filter(pr => !clientProjects.includes(pr.projectId));
  writeDb(db);
  return NextResponse.json({ ok: true });
}
