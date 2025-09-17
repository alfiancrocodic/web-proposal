import {
  getAuthToken,
  getUser,
  setAuthData,
  clearAuthData,
  isAuthenticated,
  getAuthHeaders,
  authenticatedFetch,
  User,
  AuthResponse
} from '@/lib/auth';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console.error untuk test error handling
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Auth Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('getAuthToken', () => {
    /**
     * Test untuk mendapatkan token yang valid dari localStorage
     */
    it('should return auth token from localStorage', () => {
      const mockToken = 'mock-auth-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const result = getAuthToken();

      expect(result).toBe(mockToken);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    /**
     * Test untuk kasus token tidak ada di localStorage
     */
    it('should return null when no token in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getAuthToken();

      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    /**
     * Test untuk kasus server-side rendering (window undefined)
     */
    it('should return null on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = getAuthToken();

      expect(result).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('getUser', () => {
    /**
     * Test untuk mendapatkan user data yang valid dari localStorage
     */
    it('should return parsed user data from localStorage', () => {
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        nama: 'Test User',
        email: 'test@example.com',
        jabatan: 'Developer'
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = getUser();

      expect(result).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
    });

    /**
     * Test untuk kasus user data tidak ada di localStorage
     */
    it('should return null when no user data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getUser();

      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
    });

    /**
     * Test untuk kasus JSON parsing error
     */
    it('should return null and log error when JSON parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = getUser();

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('Error parsing user data:', expect.any(SyntaxError));
    });

    /**
     * Test untuk kasus server-side rendering
     */
    it('should return null on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = getUser();

      expect(result).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('setAuthData', () => {
    /**
     * Test untuk menyimpan auth data ke localStorage
     */
    it('should store auth token and user data in localStorage', () => {
      const mockToken = 'test-token';
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        nama: 'Test User',
        email: 'test@example.com',
        jabatan: 'Developer'
      };

      setAuthData(mockToken, mockUser);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });

  describe('clearAuthData', () => {
    /**
     * Test untuk menghapus auth data dari localStorage
     */
    it('should remove auth token and user data from localStorage', () => {
      clearAuthData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    /**
     * Test untuk kasus user sudah authenticated
     */
    it('should return true when auth token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');

      const result = isAuthenticated();

      expect(result).toBe(true);
    });

    /**
     * Test untuk kasus user belum authenticated
     */
    it('should return false when no auth token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    /**
     * Test untuk mendapatkan headers dengan token
     */
    it('should return headers with authorization token', () => {
      const mockToken = 'test-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const result = getAuthHeaders();

      expect(result).toEqual({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      });
    });

    /**
     * Test untuk mendapatkan headers tanpa token
     */
    it('should return headers without authorization when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getAuthHeaders();

      expect(result).toEqual({
        'Content-Type': 'application/json'
      });
    });
  });

  describe('authenticatedFetch', () => {
    /**
     * Test untuk fetch dengan authentication headers
     */
    it('should make fetch request with auth headers', async () => {
      const mockToken = 'test-token';
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
      
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValue(mockResponse as Response);

      const url = 'http://localhost:8000/api/test';
      const options = { method: 'POST', body: JSON.stringify({ test: 'data' }) };

      await authenticatedFetch(url, options);

      expect(mockFetch).toHaveBeenCalledWith(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
    });

    /**
     * Test untuk fetch tanpa options
     */
    it('should make fetch request with default options', async () => {
      const mockToken = 'test-token';
      const mockResponse = { ok: true };
      
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValue(mockResponse as Response);

      const url = 'http://localhost:8000/api/test';

      await authenticatedFetch(url);

      expect(mockFetch).toHaveBeenCalledWith(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
    });

    /**
     * Test untuk fetch dengan existing headers
     */
    it('should merge existing headers with auth headers', async () => {
      const mockToken = 'test-token';
      const mockResponse = { ok: true };
      
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      mockFetch.mockResolvedValue(mockResponse as Response);

      const url = 'http://localhost:8000/api/test';
      const options = {
        headers: {
          'Custom-Header': 'custom-value'
        }
      };

      await authenticatedFetch(url, options);

      expect(mockFetch).toHaveBeenCalledWith(url, {
        headers: {
          'Custom-Header': 'custom-value',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        }
      });
    });

    /**
     * Test untuk error handling pada fetch
     */
    it('should propagate fetch errors', async () => {
      const mockError = new Error('Network error');
      mockFetch.mockRejectedValue(mockError);

      const url = 'http://localhost:8000/api/test';

      await expect(authenticatedFetch(url)).rejects.toThrow('Network error');
    });
  });
});