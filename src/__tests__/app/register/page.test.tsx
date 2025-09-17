import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock API functions
jest.mock('@/lib/api', () => ({
  registerUser: jest.fn(),
}));

// Mock Toast components
const mockShowWarning = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('@/components/Toast', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
    showInfo: jest.fn(),
    showToast: jest.fn(),
    ToastContainer: () => null,
  }),
}));

// Mock ErrorBoundary
jest.mock('@/components/ErrorBoundary', () => ({
  useErrorHandler: () => ({
    showError: jest.fn(),
    withErrorHandling: (fn: any) => fn,
  }),
}));

// Import komponen setelah mock
import RegisterPage from '@/app/register/page';
import { registerUser } from '@/lib/api';

// Cast mock function
const mockRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockRegisterUser.mockClear();
    mockShowWarning.mockClear();
    mockShowError.mockClear();
    mockShowSuccess.mockClear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  /**
   * Test untuk render komponen register page
   */
  it('should render register form correctly', () => {
    render(<RegisterPage />);

    // Check if all form elements are present
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Work Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Jabatan')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Login here')).toBeInTheDocument();
  });

  /**
   * Test untuk input form validation
   */
  it('should update form inputs correctly', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Work Email') as HTMLInputElement;
    const jabatanInput = screen.getByLabelText('Jabatan') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');

    expect(nameInput.value).toBe('Test User Full');
    expect(emailInput.value).toBe('test@example.com');
    expect(jabatanInput.value).toBe('Developer');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  /**
   * Test untuk successful registration
   */
  it('should handle successful registration', async () => {
    jest.useFakeTimers();
    
    const mockAuthResponse = {
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: 1,
          name: 'Test User Full',
          email: 'test@example.com',
          jabatan: 'Developer'
        },
        token: 'mock-token',
        token_type: 'Bearer'
      }
    };

    mockRegisterUser.mockResolvedValue(mockAuthResponse);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Verify that the API was called
    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
      name: 'Test User Full',
      email: 'test@example.com',
      jabatan: 'Developer',
      password: 'password123',
      password_confirmation: 'password123',
    });
    });

    // Fast-forward timers to trigger redirect
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    
    jest.useRealTimers();
  });

  /**
   * Test untuk password mismatch validation
   */
  it('should show error when passwords do not match', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'differentpassword');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password dan konfirmasi password tidak sama')).toBeInTheDocument();
    });

    // Verify API was not called
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  /**
   * Test untuk registration failure dengan error message
   */
  it('should handle registration failure with error message', async () => {
    const mockError = new Error('Email already exists');
    mockRegisterUser.mockRejectedValue(mockError);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  /**
   * Test untuk empty form submission
   */
  it('should handle empty form submission', async () => {
    render(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: 'Register' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Semua field harus diisi')).toBeInTheDocument();
    });

    // Verify API was not called
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  /**
   * Test untuk loading state during registration
   */
  it('should show loading state during registration', async () => {
    const mockAuthResponse = {
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: 1,
          name: 'Test User Full',
          email: 'test@example.com',
          jabatan: 'Developer'
        },
        token: 'mock-token',
        token_type: 'Bearer'
      }
    };

    mockRegisterUser.mockResolvedValue(mockAuthResponse);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Check if button is disabled during loading
    expect(submitButton).toBeDisabled();
  });

  /**
   * Test untuk link to login page
   */
  it('should have link to login page', () => {
    render(<RegisterPage />);
    
    const loginLink = screen.getByRole('link', { name: 'Login here' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should handle invalid email format', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowWarning).toHaveBeenCalledWith('Format email tidak valid');
    });

    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  /**
   * Test untuk network errors
   */
  it('should handle network errors', async () => {
    const mockError = new Error('Network error');
    mockRegisterUser.mockRejectedValue(mockError);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Button should not be disabled after error
    expect(submitButton).not.toBeDisabled();
  });

  /**
   * Test untuk clearing error when user starts typing again
   */
  it('should clear error when user starts typing again', async () => {
    const mockError = new Error('Test error');
    mockRegisterUser.mockRejectedValue(mockError);

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    // Fill form and submit to trigger error
    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    await userEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    // Start typing in any field to clear error
    await userEvent.type(nameInput, 'Test User Full Updated');

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  /**
   * Test untuk weak password
   */
  it('should handle weak password', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Work Email');
    const jabatanInput = screen.getByLabelText('Jabatan');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Test User Full');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(jabatanInput, 'Developer');
    await userEvent.type(passwordInput, '123');
    await userEvent.type(confirmPasswordInput, '123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password minimal 6 karakter')).toBeInTheDocument();
    });

    // Verify API was not called
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });
});