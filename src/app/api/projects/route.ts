import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { readDb, writeDb, uid, nowIso } from '@/lib/db';

// Interface untuk role dalam project
interface Role {
  name: string;
  platforms: string[];
}

// Interface untuk data project
interface Project {
  id: string;
  clientId: string;
  name: string;
  analyst: string;
  grade: string;
  roles: Role[];
  createdAt: string;
}

// Interface untuk request body POST project
interface CreateProjectRequest {
  clientId: string;
  name: string;
  analyst?: string;
  grade?: string;
  roles?: Role[];
}

/**
 * API handler untuk GET /api/projects
 * @returns Response dengan daftar semua projects
 */
export async function GET(): Promise<NextResponse> {
  const db = readDb();
  return NextResponse.json(db.projects);
}

/**
 * API handler untuk POST /api/projects
 * @param req - Next.js request object
 * @returns Response dengan project yang baru dibuat
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: CreateProjectRequest = await req.json();
  if (!body.clientId || !body.name) return NextResponse.json({ error: 'clientId and name required' }, { status: 400 });
  const db = readDb();
  const project: Project = {
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

