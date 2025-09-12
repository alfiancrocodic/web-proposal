import fs from 'fs';
import path from 'path';

// Interface untuk user
interface User {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

// Interface untuk client
interface Client {
  id: string;
  company: string;
  location: string;
  badanUsaha: string;
  picName: string;
  position: string;
  createdAt: string;
}

// Interface untuk role dalam project
interface Role {
  name: string;
  platforms: string[];
}

// Interface untuk project
interface Project {
  id: string;
  clientId: string;
  name: string;
  analyst: string;
  grade: string;
  roles: Role[];
  createdAt: string;
}

// Interface untuk proposal
interface Proposal {
  id: string;
  projectId: string;
  version: number;
  createdAt: string;
}

// Interface untuk struktur database
interface Database {
  users: User[];
  clients: Client[];
  projects: Project[];
  proposals: Proposal[];
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');

/**
 * Fungsi untuk memastikan file database ada
 */
function ensureDb(): void {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], clients: [], projects: [], proposals: [] }, null, 2));
  }
}

/**
 * Fungsi untuk membaca database
 * @returns Data database
 */
export function readDb(): Database {
  ensureDb();
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Fungsi untuk menulis database
 * @param data - Data database yang akan ditulis
 */
export function writeDb(data: Database): void {
  ensureDb();
  const tmpPath = dbPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, dbPath);
}

/**
 * Fungsi untuk generate unique ID
 * @param prefix - Prefix untuk ID
 * @returns Unique ID dengan prefix
 */
export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Fungsi untuk mendapatkan timestamp ISO saat ini
 * @returns Timestamp ISO string
 */
export function nowIso(): string {
  return new Date().toISOString();
}

