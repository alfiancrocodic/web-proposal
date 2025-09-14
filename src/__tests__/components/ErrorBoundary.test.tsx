import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

// Component yang akan throw error untuk testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error untuk menghindari noise di test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary Component', () => {
  /**
   * Test untuk render children tanpa error
   */
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  /**
   * Test untuk render error UI ketika ada error
   */
  it('should render error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Terjadi Kesalahan')).toBeInTheDocument();
    expect(screen.getByText('Aplikasi mengalami error yang tidak terduga. Silakan coba lagi atau muat ulang halaman.')).toBeInTheDocument();
  });

  /**
   * Test untuk render refresh button
   */
  it('should render refresh button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /muat ulang/i });
    expect(refreshButton).toBeInTheDocument();
  });

  /**
   * Test untuk error logging
   */
  it('should log error to console', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  /**
   * Test untuk multiple children
   */
  it('should render multiple children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  /**
   * Test untuk error boundary styling
   */
  it('should have proper error styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByText('Oops! Terjadi Kesalahan').closest('.min-h-screen');
    expect(errorContainer).toHaveClass('min-h-screen');
    expect(errorContainer).toHaveClass('flex');
    expect(errorContainer).toHaveClass('items-center');
    expect(errorContainer).toHaveClass('justify-center');
  });

  /**
   * Test untuk nested error boundaries
   */
  it('should handle nested error boundaries', () => {
    render(
      <ErrorBoundary>
        <div>Outer content</div>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner error boundary should catch the error
    expect(screen.getByText('Oops! Terjadi Kesalahan')).toBeInTheDocument();
    // Outer content should still be visible
    expect(screen.getByText('Outer content')).toBeInTheDocument();
  });
});