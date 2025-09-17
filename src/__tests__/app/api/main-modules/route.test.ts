import { NextRequest } from 'next/server';
import { GET } from '@/app/api/main-modules/route';

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

describe('/api/main-modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all main modules when no query parameter', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Verify structure of first main module
      const firstModule = data[0];
      expect(firstModule).toHaveProperty('id');
      expect(firstModule).toHaveProperty('name');
      expect(firstModule).toHaveProperty('sub_modules');
      expect(Array.isArray(firstModule.sub_modules)).toBe(true);
    });

    it('should filter main modules by query parameter', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules?q=Account';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      
      // Should contain Account module
      const accountModule = data.find((module: any) => module.name === 'Account');
      expect(accountModule).toBeDefined();
      expect(accountModule.name).toBe('Account');
    });

    it('should return empty array when query does not match any module', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules?q=NonExistentModule';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should return modules with correct sub_modules structure', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const accountModule = data.find((module: any) => module.name === 'Account');
      expect(accountModule).toBeDefined();
      expect(accountModule.sub_modules).toBeDefined();
      expect(Array.isArray(accountModule.sub_modules)).toBe(true);
      
      // Check sub module structure
      if (accountModule.sub_modules.length > 0) {
        const firstSubModule = accountModule.sub_modules[0];
        expect(firstSubModule).toHaveProperty('id');
        expect(firstSubModule).toHaveProperty('name');
        expect(firstSubModule).toHaveProperty('features');
        expect(Array.isArray(firstSubModule.features)).toBe(true);
      }
    });

    it('should return features with correct structure', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const accountModule = data.find((module: any) => module.name === 'Account');
      expect(accountModule).toBeDefined();
      
      const loginSubModule = accountModule.sub_modules.find((sub: any) => sub.name === 'Login');
      expect(loginSubModule).toBeDefined();
      expect(loginSubModule.features).toBeDefined();
      expect(Array.isArray(loginSubModule.features)).toBe(true);
      
      // Check feature structure
      if (loginSubModule.features.length > 0) {
        const firstFeature = loginSubModule.features[0];
        expect(firstFeature).toHaveProperty('id');
        expect(firstFeature).toHaveProperty('name');
        expect(firstFeature).toHaveProperty('description');
        expect(firstFeature).toHaveProperty('mandays');
        expect(typeof firstFeature.mandays).toBe('number');
      }
    });

    it('should handle case-insensitive search', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules?q=account';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      
      // Should find Account module even with lowercase query
      const accountModule = data.find((module: any) => module.name === 'Account');
      expect(accountModule).toBeDefined();
    });

    it('should handle partial search matches', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules?q=Visit';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      
      // Should find Visit Area module
      const visitModule = data.find((module: any) => module.name.includes('Visit'));
      expect(visitModule).toBeDefined();
    });

    it('should return all expected main modules', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const moduleNames = data.map((module: any) => module.name);
      expect(moduleNames).toContain('Account');
      expect(moduleNames).toContain('Visit Area');
      expect(moduleNames).toContain('AI ChatGPT');
    });

    it('should handle empty query parameter', async () => {
      const mockUrl = 'http://localhost:3000/api/main-modules?q=';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should handle malformed URL gracefully', async () => {
      const mockUrl = 'invalid-url';
      const mockRequest = {
        url: mockUrl,
      } as NextRequest;

      // This should not throw an error
      await expect(GET(mockRequest)).resolves.toBeDefined();
    });
  });
});