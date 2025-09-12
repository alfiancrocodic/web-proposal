import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { readDb, writeDb, uid, nowIso } from '@/lib/db';

// Interface untuk params route
interface RouteParams {
  params: Promise<{ id: string }>;
}

// Interface untuk proposal
interface Proposal {
  id: string;
  projectId: string;
  version: number;
  createdAt: string;
}

/**
 * API handler untuk GET /api/projects/[id]/proposals
 * @param _req - Next.js request object (tidak digunakan)
 * @param context - Context dengan params route
 * @returns Response dengan daftar proposals untuk project
 */
export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const db = readDb();
  const list = db.proposals.filter(pr => pr.projectId === id).sort((a,b) => b.version - a.version);
  return NextResponse.json(list);
}

/**
 * API handler untuk POST /api/projects/[id]/proposals
 * @param req - Next.js request object
 * @param context - Context dengan params route
 * @returns Response dengan proposal yang baru dibuat
 */
export async function POST(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const db = readDb();
  const existing = db.proposals.filter(pr => pr.projectId === id);
  const maxVersion = existing.reduce((m, pr) => Math.max(m, pr.version), 0);
  const proposal: Proposal = {
    id: uid('pr'),
    projectId: id,
    version: maxVersion + 1,
    createdAt: nowIso(),
  };
  db.proposals.push(proposal);
  writeDb(db);
  return NextResponse.json(proposal, { status: 201 });
}
