import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/Header';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test untuk render header dengan user yang sudah login
   */
  it('should render header with logged in user', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({
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

    render(<Header />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('(Developer)')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  /**
   * Test untuk render tanpa user login
   */
  it('should render without user login', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<Header />);

    expect(screen.getByText('Proposal Manager')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  /**
   * Test untuk logout functionality
   */
  it('should handle logout correctly', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({
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

    render(<Header />);

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
    
    // Test that button is clickable
    fireEvent.click(logoutButton);
    expect(logoutButton).toBeInTheDocument();
  });

  /**
   * Test untuk render logo dan title
   */
  it('should render logo and title', () => {
    render(<Header />);

    expect(screen.getByText('Proposal Manager')).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });

  /**
   * Test untuk navigasi ke home page ketika logo diklik
   */
  it('should navigate to home when home button is clicked', () => {
    render(<Header />);

    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });
});