/**
 * Library untuk authentication utilities
 */

/**
 * Interface untuk user data
 */
export interface User {
  id: number;
  name: string;
  nama: string;
  email: string;
  jabatan: string;
}

/**
 * Interface untuk response API authentication
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Fungsi untuk mendapatkan token dari localStorage
 * @returns Token authentication atau null
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

/**
 * Fungsi untuk mendapatkan user data dari localStorage
 * @returns User data atau null
 */
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
  }
  return null;
};

/**
 * Fungsi untuk menyimpan authentication data
 * @param token - Authentication token
 * @param user - User data
 */
export const setAuthData = (token: string, user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Fungsi untuk menghapus authentication data
 */
export const clearAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};

/**
 * Fungsi untuk mengecek apakah user sudah login
 * @returns Boolean status login
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Fungsi untuk membuat headers dengan authorization
 * @returns Headers object dengan authorization
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Fungsi untuk melakukan API call dengan authentication
 * @param url - URL endpoint
 * @param options - Fetch options
 * @returns Promise response
 */
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};