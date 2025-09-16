/**
 * Konfigurasi API untuk aplikasi frontend
 */

// Base URL untuk API backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

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

// ===== CLIENT API FUNCTIONS =====

/**
 * Interface untuk data client
 */
export interface Client {
  id: number;
  company: string;
  location: string;
  badanUsaha: string;
  picName: string;
  position: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface untuk form data client
 */
export interface ClientFormData {
  company: string;
  location: string;
  badanUsaha: string;
  picName: string;
  position: string;
}

/**
 * Fungsi untuk mendapatkan semua client dari backend
 * @returns Promise dengan array client
 */
export const getClients = async (): Promise<Client[]> => {
  const response = await apiCall('/api/clients');
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data client');
  }
  
  return response.json();
};

/**
 * Fungsi untuk mendapatkan client berdasarkan ID
 * @param id - ID client
 * @returns Promise dengan data client
 */
export const getClient = async (id: number): Promise<Client> => {
  const response = await apiCall(`/api/clients/${id}`);
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data client');
  }
  
  return response.json();
};

/**
 * Fungsi untuk membuat client baru
 * @param clientData - Data client yang akan dibuat
 * @returns Promise dengan client yang dibuat
 */
export const createClient = async (clientData: ClientFormData): Promise<Client> => {
  const response = await apiCall('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal membuat client');
  }
  
  return response.json();
};

/**
 * Fungsi untuk update client
 * @param id - ID client
 * @param clientData - Data client yang akan diupdate
 * @returns Promise dengan client yang diupdate
 */
export const updateClient = async (id: number, clientData: ClientFormData): Promise<Client> => {
  const response = await apiCall(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate client');
  }
  
  return response.json();
};

/**
 * Fungsi untuk menghapus client
 * @param id - ID client
 * @returns Promise void
 */
export const deleteClient = async (id: number): Promise<void> => {
  const response = await apiCall(`/api/clients/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus client');
  }
};

// ===== PROJECT API FUNCTIONS =====

/**
 * Interface untuk data project
 */
export interface Project {
  id: number;
  client_id: number;
  name: string;
  analyst: string;
  grade: string;
  roles: string[];
  client?: Client;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface untuk form data project
 */
export interface ProjectFormData {
  client_id: number;
  name: string;
  analyst: string;
  grade: string;
  roles: string[];
}

/**
 * Fungsi untuk mendapatkan semua project dari backend
 * @returns Promise dengan array project
 */
export const getProjects = async (): Promise<Project[]> => {
  const response = await apiCall('/api/projects');
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data project');
  }
  
  return response.json();
};

/**
 * Fungsi untuk mendapatkan project berdasarkan ID
 * @param id - ID project
 * @returns Promise dengan data project
 */
export const getProject = async (id: number): Promise<Project> => {
  const response = await apiCall(`/api/projects/${id}`);
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data project');
  }
  
  return response.json();
};

/**
 * Fungsi untuk membuat project baru
 * @param projectData - Data project yang akan dibuat
 * @returns Promise dengan project yang dibuat
 */
export const createProject = async (projectData: ProjectFormData): Promise<Project> => {
  const response = await apiCall('/api/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal membuat project');
  }
  
  return response.json();
};

/**
 * Fungsi untuk update project
 * @param id - ID project
 * @param projectData - Data project yang akan diupdate
 * @returns Promise dengan project yang diupdate
 */
export const updateProject = async (id: number, projectData: ProjectFormData): Promise<Project> => {
  const response = await apiCall(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate project');
  }
  
  return response.json();
};

/**
 * Fungsi untuk menghapus project
 * @param id - ID project
 * @returns Promise void
 */
export const deleteProject = async (id: number): Promise<void> => {
  const response = await apiCall(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus project');
  }
};

// ===== MODULE CATALOG API FUNCTIONS =====

/**
 * Cari main modules dengan opsi include relasi dan pagination
 * @param params - Parameter pencarian dan include
 * @returns Promise array main modules (paginated data.data)
 */
export const searchMainModules = async (params: {
  search: string;
  with_sub_modules?: boolean;
  with_features?: boolean;
  is_active?: boolean;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
}): Promise<any[]> => {
  const qs = new URLSearchParams();
  qs.set('search', params.search || '');
  if (params.with_sub_modules) qs.set('with_sub_modules', 'true');
  if (params.with_features) qs.set('with_features', 'true');
  if (typeof params.is_active === 'boolean') qs.set('is_active', String(params.is_active));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.sort_by) qs.set('sort_by', params.sort_by);
  if (params.sort_order) qs.set('sort_order', params.sort_order);

  const response = await apiCall(`/api/main-modules?${qs.toString()}`);
  const json = await response.json();
  if (!response.ok || !json?.success) {
    const message = json?.message || 'Gagal mengambil main modules';
    throw new Error(message);
  }
  // Laravel pagination object has { data: [...], ... }
  return Array.isArray(json.data?.data) ? json.data.data : [];
};

/**
 * Ambil sub module lengkap dengan features dan conditions
 * @param id - ID sub module
 * @returns Promise object sub module lengkap
 */
export const getSubModuleComplete = async (id: number | string): Promise<any> => {
  const response = await apiCall(`/api/sub-modules/${id}/complete`);
  const json = await response.json();
  if (!response.ok || !json?.success) {
    const message = json?.message || 'Gagal mengambil detail sub module';
    throw new Error(message);
  }
  return json.data;
};

// ===== PROPOSAL API FUNCTIONS =====

/**
 * Interface untuk data proposal
 */
export interface Proposal {
  id: number;
  project_id: number;
  version: string;
  project?: Project;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface untuk form data proposal
 */
export interface ProposalFormData {
  project_id: number;
  version: string;
}

/**
 * Fungsi untuk mendapatkan semua proposal dari backend
 * @returns Promise dengan array proposal
 */
export const getProposals = async (): Promise<Proposal[]> => {
  const response = await apiCall('/api/proposals');
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data proposal');
  }
  
  return response.json();
};

/**
 * Fungsi untuk mendapatkan proposal berdasarkan ID
 * @param id - ID proposal
 * @returns Promise dengan data proposal
 */
export const getProposal = async (id: number): Promise<Proposal> => {
  const response = await apiCall(`/api/proposals/${id}`);
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data proposal');
  }
  
  return response.json();
};

/**
 * Fungsi untuk membuat proposal baru
 * @param proposalData - Data proposal yang akan dibuat
 * @returns Promise dengan proposal yang dibuat
 */
export const createProposal = async (proposalData: ProposalFormData): Promise<Proposal> => {
  const response = await apiCall('/api/proposals', {
    method: 'POST',
    body: JSON.stringify(proposalData),
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal membuat proposal');
  }
  
  return response.json();
};

/**
 * Fungsi untuk update proposal
 * @param id - ID proposal
 * @param proposalData - Data proposal yang akan diupdate
 * @returns Promise dengan proposal yang diupdate
 */
export const updateProposal = async (id: number, proposalData: ProposalFormData): Promise<Proposal> => {
  const response = await apiCall(`/api/proposals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(proposalData),
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate proposal');
  }
  
  return response.json();
};

/**
 * Fungsi untuk menghapus proposal
 * @param id - ID proposal
 * @returns Promise void
 */
export const deleteProposal = async (id: number): Promise<void> => {
  const response = await apiCall(`/api/proposals/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus proposal');
  }
};

// ===== PROPOSAL BUILDER TEMPLATE & CONTENT =====

export const getProposalTemplates = async (): Promise<any> => {
  const response = await apiCall('/api/proposal/templates');
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil template proposal');
  }
  return response.json();
};

export const getProposalContent = async (proposalId: number | string): Promise<any> => {
  const response = await apiCall(`/api/proposals/${proposalId}/content`);
  if (!response.ok) {
    // jika belum ada content, backend akan kembalikan {} / 200
    try { return await response.json(); } catch { return {}; }
  }
  return response.json();
};

export const putProposalContent = async (proposalId: number | string, data: any): Promise<void> => {
  const response = await apiCall(`/api/proposals/${proposalId}/content`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.message || 'Gagal menyimpan content proposal');
  }
};
