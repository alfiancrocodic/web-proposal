import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

// Interface untuk params route
interface RouteParams {
  params: Promise<{ id: string }>;
}

// Interface untuk update project request
interface UpdateProjectRequest {
  name?: string;
  analyst?: string;
  grade?: string;
  roles?: any[];
}

/**
 * API handler untuk GET /api/projects/[id]
 * @param _req - Next.js request object (tidak digunakan)
 * @param context - Context dengan params route
 * @returns Response dengan data project
 */
export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const db = readDb();
  const altId = String(id).startsWith('p-') ? String(id) : `p-${id}`;
  const project = db.projects.find(p => p.id === id || p.id === altId);
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(project);
}

/**
 * API handler untuk PUT /api/projects/[id]
 * @param req - Next.js request object
 * @param context - Context dengan params route
 * @returns Response dengan project yang sudah diupdate
 */
export async function PUT(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const body: UpdateProjectRequest = await req.json();
  const { id } = await params;
  const db = readDb();
  const altId = String(id).startsWith('p-') ? String(id) : `p-${id}`;
  const idx = db.projects.findIndex(p => p.id === id || p.id === altId);
  if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.projects[idx] = { ...db.projects[idx], ...body };
  writeDb(db);
  return NextResponse.json(db.projects[idx]);
}

/**
 * API handler untuk DELETE /api/projects/[id]
 * @param _req - Next.js request object (tidak digunakan)
 * @param context - Context dengan params route
 * @returns Response konfirmasi penghapusan
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const db = readDb();
  const altId = String(id).startsWith('p-') ? String(id) : `p-${id}`;
  const before = db.projects.length;
  db.projects = db.projects.filter(p => p.id !== id && p.id !== altId);
  if (db.projects.length === before) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.proposals = db.proposals.filter(pr => pr.projectId !== id && pr.projectId !== altId);
  writeDb(db);
  return NextResponse.json({ ok: true });
}
