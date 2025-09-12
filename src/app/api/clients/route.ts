import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { readDb, writeDb, uid, nowIso } from '@/lib/db';

// Interface untuk data client
interface Client {
  id: string;
  company: string;
  location: string;
  badanUsaha: string;
  picName: string;
  position: string;
  createdAt: string;
}

// Interface untuk request body POST client
interface CreateClientRequest {
  company: string;
  location?: string;
  badanUsaha?: string;
  picName?: string;
  position?: string;
}

/**
 * API handler untuk GET /api/clients
 * @returns Response dengan daftar semua clients
 */
export async function GET(): Promise<NextResponse> {
  const db = readDb();
  return NextResponse.json(db.clients);
}

/**
 * API handler untuk POST /api/clients
 * @param req - Next.js request object
 * @returns Response dengan client yang baru dibuat
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: CreateClientRequest = await req.json();
  if (!body.company) return NextResponse.json({ error: 'company required' }, { status: 400 });
  const db = readDb();
  const client: Client = {
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

