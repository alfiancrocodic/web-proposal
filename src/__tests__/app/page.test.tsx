import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';
import { getClients, getProjects, createClient, updateClient } from '@/lib/api';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API functions
jest.mock('@/lib/api', () => ({
  getClients: jest.fn(),
  getProjects: jest.fn(),
  createClient: jest.fn(),
  updateClient: jest.fn(),
}));

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

const mockGetClients = getClients as jest.MockedFunction<typeof getClients>;
const mockGetProjects = getProjects as jest.MockedFunction<typeof getProjects>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockUpdateClient = updateClient as jest.MockedFunction<typeof updateClient>;

describe('Home Page', () => {
  const mockClients = [
    { id: 1, company: 'PT ABC', location: 'Jakarta', badanUsaha: 'PT', picName: 'John Doe', position: 'Manager' },
    { id: 2, company: 'PT XYZ', location: 'Surabaya', badanUsaha: 'PT', picName: 'Jane Smith', position: 'Director' }
  ];

  const mockProjects = [
    { id: 1, client_id: 1, name: 'Project A', analyst: 'Analyst 1', grade: 'A', roles: ['Developer'] },
    { id: 2, client_id: 2, name: 'Project B', analyst: 'Analyst 2', grade: 'B', roles: ['Designer'] }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({
          id: 1,
          nama: 'Test User',
          email: 'test@example.com',
          jabatan: 'Developer'
        });
      }
      if (key === 'auth_token') {
        return 'mock-token';
      }
      return null;
    });
    
    // Mock API functions
    (getClients as jest.Mock).mockResolvedValue(mockClients);
    (getProjects as jest.Mock).mockResolvedValue(mockProjects);
    (createClient as jest.Mock).mockResolvedValue({ id: 3, company: 'New Company', location: 'Medan', badanUsaha: 'PT', picName: 'New PIC', position: 'Manager' });
    (updateClient as jest.Mock).mockResolvedValue({ id: 1, company: 'Updated Company', location: 'Jakarta', badanUsaha: 'PT', picName: 'John Doe', position: 'Manager' });
  });

  /**
   * Test untuk render komponen home page
   */
  it('should render home page correctly', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Proposal Manager')).toBeInTheDocument();
    });

    expect(screen.getByText('Recent Clients')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Add new client')).toBeInTheDocument();
  });

  /**
   * Test untuk loading state saat fetch data
   */
  it('should show loading state while fetching data', async () => {
    // Mock delayed responses
    mockGetClients.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockClients), 1000)));
    mockGetProjects.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProjects), 1000)));

    render(<Home />);

    // Should show the main components even during loading
    expect(screen.getByText('Proposal Manager')).toBeInTheDocument();
    expect(screen.getByText('Add new client')).toBeInTheDocument();
  });

  /**
   * Test untuk menampilkan daftar clients
   */
  it('should display clients list correctly', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getAllByText('PT ABC')).toHaveLength(1);
      expect(screen.getAllByText('PT XYZ')).toHaveLength(1);
    });

    expect(screen.getByText('Jakarta')).toBeInTheDocument();
    expect(screen.getByText('Surabaya')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  /**
   * Test untuk menampilkan daftar projects
   */
  it('should display projects list correctly', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.getByText('Project B')).toBeInTheDocument();
    });
  });

  /**
   * Test untuk form add new client
   */
  it('should handle add new client form submission', async () => {
    const newClient = {
      id: 3,
      company: 'New Company',
      location: 'Semarang',
      badanUsaha: 'Swasta',
      picName: 'New Person',
      position: 'CEO'
    };

    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);
    mockCreateClient.mockResolvedValue(newClient);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Add New Client')).toBeInTheDocument();
    });

    // Fill form
    const companyInput = screen.getByLabelText('Company Name');
    const locationInput = screen.getByLabelText('Location');
    const picNameInput = screen.getByLabelText('PIC Name');
    const positionInput = screen.getByLabelText('Position');
    const submitButton = screen.getByRole('button', { name: 'Add Client' });

    fireEvent.change(companyInput, { target: { value: 'New Company' } });
    fireEvent.change(locationInput, { target: { value: 'Semarang' } });
    fireEvent.change(picNameInput, { target: { value: 'New Person' } });
    fireEvent.change(positionInput, { target: { value: 'CEO' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        company: 'New Company',
        location: 'Semarang',
        badanUsaha: 'Swasta',
        picName: 'New Person',
        position: 'CEO'
      });
    });
  });

  /**
   * Test untuk error handling saat fetch clients gagal
   */
  it('should handle error when fetching clients fails', async () => {
    const mockError = new Error('Failed to fetch clients');
    mockGetClients.mockRejectedValue(mockError);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Error loading clients')).toBeInTheDocument();
    });
  });

  /**
   * Test untuk error handling saat fetch projects gagal
   */
  it('should handle error when fetching projects fails', async () => {
    const mockError = new Error('Failed to fetch projects');
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockRejectedValue(mockError);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Error loading projects')).toBeInTheDocument();
    });
  });

  /**
   * Test untuk search functionality
   */
  it('should filter clients based on search term', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search clients...');
    fireEvent.change(searchInput, { target: { value: 'Company 1' } });

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Company 2')).not.toBeInTheDocument();
    });
  });

  /**
   * Test untuk filter functionality
   */
  it('should filter clients by location', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
    });

    // Open filter
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);

    // Select Jakarta filter
    const jakartaFilter = screen.getByLabelText('Jakarta');
    fireEvent.click(jakartaFilter);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Company 2')).not.toBeInTheDocument();
    });
  });

  /**
   * Test untuk edit client functionality
   */
  it('should handle edit client', async () => {
    const updatedClient = {
      ...mockClients[0],
      company: 'Updated Company Name'
    };

    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);
    mockUpdateClient.mockResolvedValue(updatedClient);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Should open edit modal
    await waitFor(() => {
      expect(screen.getByText('Edit Client')).toBeInTheDocument();
    });

    // Update company name
    const companyInput = screen.getByDisplayValue('Test Company 1');
    fireEvent.change(companyInput, { target: { value: 'Updated Company Name' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateClient).toHaveBeenCalledWith('c-1', expect.objectContaining({
        company: 'Updated Company Name'
      }));
    });
  });

  /**
   * Test untuk navigation ke projects page
   */
  it('should navigate to projects page when clicking project', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });

    const projectLink = screen.getByText('Test Project 1');
    fireEvent.click(projectLink);

    expect(mockPush).toHaveBeenCalledWith('/projects/p-1');
  });

  /**
   * Test untuk empty state ketika tidak ada clients
   */
  it('should show empty state when no clients', async () => {
    mockGetClients.mockResolvedValue([]);
    mockGetProjects.mockResolvedValue([]);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('No clients found')).toBeInTheDocument();
    });
  });

  /**
   * Test untuk empty state ketika tidak ada projects
   */
  it('should show empty state when no projects', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue([]);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
    });
  });

  /**
   * Test untuk form validation pada add client
   */
  it('should validate required fields in add client form', async () => {
    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Add New Client')).toBeInTheDocument();
    });

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: 'Add Client' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });

    // Verify API was not called
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  /**
   * Test untuk responsive behavior
   */
  it('should handle mobile view correctly', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    mockGetClients.mockResolvedValue(mockClients);
    mockGetProjects.mockResolvedValue(mockProjects);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Proposal Manager')).toBeInTheDocument();
    });

    // Should show mobile-friendly layout
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});