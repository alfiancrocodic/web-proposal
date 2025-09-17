import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/proposals/route';
import { getProposals, createProposal } from '@/lib/api';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getProposals: jest.fn(),
  createProposal: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
      headers: new Headers(),
    })),
  },
  NextRequest: jest.fn(),
}));

// Mock console.error
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const mockGetProposals = getProposals as jest.MockedFunction<typeof getProposals>;
const mockCreateProposal = createProposal as jest.MockedFunction<typeof createProposal>;

describe('/api/proposals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('GET', () => {
    it('should return proposals successfully', async () => {
      const mockProposals = [
        { id: 1, project_id: 1, version: '1.0' },
        { id: 2, project_id: 2, version: '2.0' }
      ];

      mockGetProposals.mockResolvedValue(mockProposals);

      const response = await GET();
      const data = await response.json();

      expect(mockGetProposals).toHaveBeenCalledTimes(1);
      expect(data).toEqual(mockProposals);
      expect(response.status).toBe(200);
    });

    it('should handle error when fetching proposals fails', async () => {
      const errorMessage = 'Database connection failed';
      mockGetProposals.mockRejectedValue(new Error(errorMessage));

      const response = await GET();
      const data = await response.json();

      expect(mockGetProposals).toHaveBeenCalledTimes(1);
      expect(data).toEqual({ error: 'Failed to fetch proposals' });
      expect(response.status).toBe(500);
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching proposals:', expect.any(Error));
    });

    it('should return empty array when no proposals exist', async () => {
      mockGetProposals.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(mockGetProposals).toHaveBeenCalledTimes(1);
      expect(data).toEqual([]);
      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should create proposal successfully', async () => {
      const proposalData = {
        project_id: 1,
        version: '1.0'
      };

      const mockCreatedProposal = {
        id: 1,
        ...proposalData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockCreateProposal.mockResolvedValue(mockCreatedProposal);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(proposalData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).toHaveBeenCalledWith(proposalData);
      expect(data).toEqual(mockCreatedProposal);
      expect(response.status).toBe(201);
    });

    it('should return 400 when project_id is missing', async () => {
      const invalidData = {
        version: '1.0'
        // project_id is missing
      };

      const mockRequest = {
        json: jest.fn().mockResolvedValue(invalidData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).not.toHaveBeenCalled();
      expect(data).toEqual({ error: 'Project ID and version are required' });
      expect(response.status).toBe(400);
    });

    it('should return 400 when version is missing', async () => {
      const invalidData = {
        project_id: 1
        // version is missing
      };

      const mockRequest = {
        json: jest.fn().mockResolvedValue(invalidData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).not.toHaveBeenCalled();
      expect(data).toEqual({ error: 'Project ID and version are required' });
      expect(response.status).toBe(400);
    });

    it('should return 400 when both project_id and version are missing', async () => {
      const invalidData = {};

      const mockRequest = {
        json: jest.fn().mockResolvedValue(invalidData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).not.toHaveBeenCalled();
      expect(data).toEqual({ error: 'Project ID and version are required' });
      expect(response.status).toBe(400);
    });

    it('should handle error when creating proposal fails', async () => {
      const proposalData = {
        project_id: 1,
        version: '1.0'
      };

      const errorMessage = 'Database constraint violation';
      mockCreateProposal.mockRejectedValue(new Error(errorMessage));

      const mockRequest = {
        json: jest.fn().mockResolvedValue(proposalData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).toHaveBeenCalledWith(proposalData);
      expect(data).toEqual({ error: 'Failed to create proposal' });
      expect(response.status).toBe(500);
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating proposal:', expect.any(Error));
    });

    it('should handle malformed JSON in request body', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).not.toHaveBeenCalled();
      expect(data).toEqual({ error: 'Failed to create proposal' });
      expect(response.status).toBe(500);
      expect(mockConsoleError).toHaveBeenCalledWith('Error creating proposal:', expect.any(Error));
    });

    it('should handle project_id as string number', async () => {
      const proposalData = {
        project_id: '1', // String instead of number
        version: '1.0'
      };

      const mockCreatedProposal = {
        id: 1,
        project_id: 1,
        version: '1.0'
      };

      mockCreateProposal.mockResolvedValue(mockCreatedProposal);

      const mockRequest = {
        json: jest.fn().mockResolvedValue(proposalData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).toHaveBeenCalledWith(proposalData);
      expect(data).toEqual(mockCreatedProposal);
      expect(response.status).toBe(201);
    });

    it('should handle empty string values', async () => {
      const proposalData = {
        project_id: 1,
        version: '' // Empty string
      };

      const mockRequest = {
        json: jest.fn().mockResolvedValue(proposalData),
      } as unknown as NextRequest;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(mockRequest.json).toHaveBeenCalledTimes(1);
      expect(mockCreateProposal).not.toHaveBeenCalled();
      expect(data).toEqual({ error: 'Project ID and version are required' });
      expect(response.status).toBe(400);
    });
  });
});