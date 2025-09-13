/**
 * Konfigurasi API untuk aplikasi frontend
 */

// Base URL untuk API backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

/**
 * Interface untuk response API authentication
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      jabatan: string;
    };
    token: string;
    token_type: string;
  };
}

/**
 * Interface untuk error response
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Fungsi untuk membuat URL lengkap API
 * @param endpoint - Endpoint API (contoh: '/api/login')
 * @returns URL lengkap
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Fungsi untuk mendapatkan auth token dari localStorage
 * @returns Auth token atau null
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
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
 * Konfigurasi untuk retry dan timeout
 */
const API_CONFIG = {
  timeout: 10000, // 10 detik
  retryAttempts: 3,
  retryDelay: 1000, // 1 detik
};

/**
 * Fungsi untuk membuat fetch dengan timeout
 * @param url - URL untuk fetch
 * @param options - Fetch options
 * @param timeout - Timeout dalam milliseconds
 * @returns Promise response
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.timeout
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - Koneksi terlalu lambat');
    }
    throw error;
  }
};

/**
 * Fungsi untuk delay/sleep
 * @param ms - Milliseconds untuk delay
 * @returns Promise void
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Fungsi untuk melakukan API call dengan authentication, retry, dan timeout
 * @param endpoint - Endpoint API
 * @param options - Fetch options
 * @param retryCount - Jumlah retry yang sudah dilakukan
 * @returns Promise response
 */
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers,
    });

    // Jika response tidak ok dan bukan error client (4xx), coba retry
    if (!response.ok && response.status >= 500 && retryCount < API_CONFIG.retryAttempts) {
      await delay(API_CONFIG.retryDelay * (retryCount + 1)); // Exponential backoff
      return apiCall(endpoint, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    // Retry untuk network errors
    if (retryCount < API_CONFIG.retryAttempts) {
      await delay(API_CONFIG.retryDelay * (retryCount + 1));
      return apiCall(endpoint, options, retryCount + 1);
    }
    
    // Jika sudah mencapai max retry, throw error
    throw error;
  }
};

/**
 * Fungsi untuk login user
 * @param email - Email user
 * @param password - Password user
 * @returns Promise dengan data user dan token
 */
export const loginUser = async (email: string, password: string): Promise<{ user: any; token: string }> => {
  const response = await apiCall('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Login gagal');
  }

  const result: AuthResponse = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Login gagal');
  }

  return {
    user: result.data.user,
    token: result.data.token
  };
};

/**
 * Fungsi untuk logout user
 * @returns Promise void
 */
export const logoutUser = async (): Promise<void> => {
  const token = getAuthToken();
  
  if (token) {
    try {
      await apiCall('/api/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};

/**
 * Fungsi untuk register user
 * @param userData - Data user untuk registrasi
 * @returns Promise dengan response authentication
 */
export const registerUser = async (userData: {
  name: string;
  email: string;
  jabatan: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> => {
  const response = await apiCall('/api/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Registrasi gagal');
  }

  return response.json();
};