import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/app/login/page';
import { loginUser } from '@/lib/api';

// Mock the api module
jest.mock('@/lib/api', () => ({
  loginUser: jest.fn(),
}));

// Mock the next/navigation module
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('LoginPage', () => {
  // Cast the mocked function to the Jest mock type
  const mockedLoginUser = loginUser as jest.Mock;

  beforeEach(() => {
    // Clear mock history and implementation before each test
    mockedLoginUser.mockClear();
    mockRouterPush.mockClear();
    (localStorageMock.setItem as jest.Mock).mockClear();
    (localStorageMock.getItem as jest.Mock).mockClear();
    (localStorageMock.clear as jest.Mock).mockClear();
    (localStorageMock.removeItem as jest.Mock).mockClear();
    localStorageMock.clear();
    jest.useFakeTimers(); // Use fake timers for setTimeout
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers
  });

  it('should render the login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByRole('textbox', { name: /work email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should allow user to type in email and password fields', () => {
    render(<LoginPage />);
    const emailInput = screen.getByRole('textbox', { name: /work email/i }) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('should handle successful login', async () => {
    const mockUserData = { user: { id: 1, name: 'Test User' }, token: 'fake-token' };
    mockedLoginUser.mockResolvedValue(mockUserData);

    render(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /work email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Check for loading state
    expect(loginButton).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockedLoginUser).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    // Check localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'fake-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUserData.user));

    // Check for success toast
    await waitFor(() => {
      expect(screen.getByText(/Login berhasil!/)).toBeInTheDocument();
    }, { timeout: 6000 });

    // Fast-forward the timer for the redirect
    jest.advanceTimersByTime(1000);

    // Check for redirect
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  it('should handle failed login', async () => {
    const errorMessage = 'Invalid credentials';
    mockedLoginUser.mockRejectedValue(new Error(errorMessage));

    render(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /work email/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }, { timeout: 6000 });

    // Check that redirect did not happen
    expect(mockRouterPush).not.toHaveBeenCalled();

    // Check that the button is re-enabled
    expect(loginButton).not.toBeDisabled();
  });
});