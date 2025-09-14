import {
  getClients,
  createClient,
  getProjects,
  createProject,
  getProposals,
  createProposal,
  loginUser,
  registerUser,
  ClientFormData,
  ProjectFormData,
  ProposalFormData
} from '@/lib/api';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('API Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Client API', () => {
    /**
     * Test untuk mengambil semua clients
     */
    it('should fetch all clients successfully', async () => {
      const mockClients = [
        { id: 'c-1', company: 'Test Company', location: 'Jakarta' },
        { id: 'c-2', company: 'Another Company', location: 'Bandung' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockClients
      } as Response);

      const result = await getClients();
      expect(result).toEqual(mockClients);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/clients', expect.objectContaining({}));
    });

    /**
     * Test untuk membuat client baru
     */
    it('should create a new client successfully', async () => {
      const clientData: ClientFormData = {
        company: 'New Company',
        location: 'Semarang',
        badanUsaha: 'Swasta',
        picName: 'John Doe',
        position: 'Manager'
      };

      const mockResponse = {
        id: 'c-3',
        ...clientData,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await createClient(clientData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/clients', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(clientData)
      }));
    });
  });

  describe('Project API', () => {
    /**
     * Test untuk mengambil semua projects
     */
    it('should fetch all projects successfully', async () => {
      const mockProjects = [
        { id: 'p-1', name: 'Test Project', clientId: 'c-1' },
        { id: 'p-2', name: 'Another Project', clientId: 'c-2' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects
      } as Response);

      const result = await getProjects();
      expect(result).toEqual(mockProjects);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/projects', expect.objectContaining({}));
    });

    /**
     * Test untuk membuat project baru
     */
    it('should create a new project successfully', async () => {
      const projectData: ProjectFormData = {
        client_id: 1,
        name: 'New Project',
        analyst: 'Jane Doe',
        grade: 'A',
        roles: ['Developer']
      };

      const mockResponse = {
        id: 'p-3',
        ...projectData,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await createProject(projectData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/projects', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(projectData)
      }));
    });
  });

  describe('Proposal API', () => {
    /**
     * Test untuk mengambil semua proposals
     */
    it('should fetch all proposals successfully', async () => {
      const mockProposals = [
        { id: 'pr-1', projectId: 'p-1', version: 1 },
        { id: 'pr-2', projectId: 'p-2', version: 1 }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProposals
      } as Response);

      const result = await getProposals();
      expect(result).toEqual(mockProposals);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/proposals', expect.objectContaining({}));
    });

    /**
     * Test untuk membuat proposal baru
     */
    it('should create a new proposal successfully', async () => {
      const proposalData: ProposalFormData = {
        project_id: 1,
        version: '2'
      };

      const mockResponse = {
        id: 'pr-3',
        projectId: 'p-1',
        version: 2,
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await createProposal(proposalData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/proposals', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(proposalData)
      }));
    });
  });

  describe('Authentication API', () => {
    /**
     * Test untuk login user berhasil
     */
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockApiResponse = {
        success: true,
        message: 'Login berhasil',
        data: {
          user: { id: 1, email, name: 'Test User', jabatan: 'Developer' },
          token: 'mock-jwt-token',
          token_type: 'Bearer'
        }
      };

      const expectedResult = {
        user: mockApiResponse.data.user,
        token: mockApiResponse.data.token
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      } as Response);

      const result = await loginUser(email, password);
      expect(result).toEqual(expectedResult);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/login', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, password })
      }));
    });

    /**
     * Test untuk register user
     */
    it('should register user successfully', async () => {
      const registerData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        jabatan: 'Developer'
      };

      const mockResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: 2,
            name: 'New User',
            email: 'newuser@example.com',
            jabatan: 'Developer'
          },
          token: 'mock-token',
          token_type: 'Bearer'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await registerUser(registerData);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/register', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(registerData)
      }));
    });
  });

  describe('Error Handling', () => {
    /**
     * Test untuk handling error pada API call
     */
    it('should handle API errors properly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      } as Response);

      await expect(getClients()).rejects.toThrow();
    });

    /**
     * Test untuk handling network errors
     */
    it('should handle network errors properly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getClients()).rejects.toThrow();
    }, 10000);
  });
});