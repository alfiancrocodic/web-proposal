import { GET, POST } from '@/app/api/projects/route';
import { NextRequest } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

// Mock database functions
jest.mock('@/lib/db', () => ({
  readDb: jest.fn(),
  writeDb: jest.fn(),
  uid: jest.fn(),
  nowIso: jest.fn(),
}));

describe('/api/projects API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    /**
     * Test untuk GET projects berhasil
     */
    it('should return projects successfully', async () => {
      const mockProjects = [
        {
          id: 'p1',
          name: 'Test Project 1',
          clientId: 'c1',
          analyst: 'John Doe',
          grade: 'A',
          roles: [],
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'p2',
          name: 'Test Project 2',
          clientId: 'c2',
          analyst: 'Jane Smith',
          grade: 'B',
          roles: [],
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      (readDb as jest.Mock).mockReturnValue({
        projects: mockProjects
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProjects);
      expect(readDb).toHaveBeenCalled();
    });

    /**
     * Test untuk GET projects dengan database kosong
     */
    it('should return empty array when no projects', async () => {
      (readDb as jest.Mock).mockReturnValue({
        projects: []
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    /**
     * Test untuk GET projects dengan database error
     */
    it('should handle database error', async () => {
      (readDb as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      try {
        await GET();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('POST /api/projects', () => {
    /**
     * Test untuk POST project berhasil
     */
    it('should create project successfully', async () => {
      const newProject = {
        name: 'New Test Project',
        clientId: 'c1',
        analyst: 'John Doe',
        grade: 'A',
        roles: [{
          name: 'Developer',
          platforms: ['Web Frontend', 'Web Backend']
        }]
      };

      const mockDb = {
        projects: [],
        clients: []
      };

      (readDb as jest.Mock).mockReturnValue(mockDb);
      (require('@/lib/db').uid as jest.Mock).mockReturnValue('p123');
      (require('@/lib/db').nowIso as jest.Mock).mockReturnValue('2024-01-01T00:00:00Z');

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(newProject.name);
      expect(data.clientId).toBe(newProject.clientId);
      expect(writeDb).toHaveBeenCalled();
    });

    /**
     * Test untuk POST project dengan data invalid
     */
    it('should handle invalid project data', async () => {
      const invalidProject = {
        name: '', // nama kosong
        clientId: '', // clientId kosong
      };

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(invalidProject),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('clientId and name required');
    });

    /**
     * Test untuk POST project dengan JSON invalid
     */
    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      try {
        await POST(request);
        // If no error is thrown, the test should fail
        expect(true).toBe(false);
      } catch (error: unknown) {
        // Expect a SyntaxError to be thrown
        expect(error).toBeInstanceOf(SyntaxError);
        expect((error as Error).message).toBe('Unexpected token in JSON');
      }
    });

    /**
     * Test untuk POST project dengan missing clientId
     */
    it('should handle missing clientId', async () => {
      const newProject = {
        name: 'Test Project',
        analyst: 'John Doe',
        grade: 'A'
      };

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('clientId and name required');
    });
  });
});