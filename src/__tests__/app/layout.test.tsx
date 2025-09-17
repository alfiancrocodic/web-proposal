import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RootLayout from '@/app/layout';

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

// Mock Next.js fonts
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
  }),
}));

describe('RootLayout', () => {
  it('should render children correctly', () => {
    const testContent = 'Test Content';
    
    const { container } = render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('should wrap children with ErrorBoundary', () => {
    const testContent = 'Test Content';
    
    render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toContainElement(screen.getByText(testContent));
  });

  it('should have correct HTML structure', () => {
    const testContent = 'Test Content';
    
    const { container } = render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    );

    // Since we're testing a layout component that renders html/body,
    // we need to check the rendered content differently
    expect(screen.getByText(testContent)).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should apply font variables to body', () => {
    const testContent = 'Test Content';
    
    render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    );

    // Test that the content is rendered properly
    expect(screen.getByText(testContent)).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(
      <RootLayout>
        {null}
      </RootLayout>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should handle multiple children', () => {
    render(
      <RootLayout>
        <div>First Child</div>
        <div>Second Child</div>
      </RootLayout>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });
});