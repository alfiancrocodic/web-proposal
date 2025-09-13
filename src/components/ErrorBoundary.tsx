"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Interface untuk props ErrorBoundary
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Interface untuk state ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Komponen ErrorBoundary untuk menangani error yang tidak terduga
 * Menangkap error di komponen child dan menampilkan fallback UI
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Static method untuk update state ketika error terjadi
   * @param error - Error yang terjadi
   * @returns State baru
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Method untuk menangani error dan logging
   * @param error - Error yang terjadi
   * @param errorInfo - Informasi tambahan tentang error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Di sini bisa ditambahkan logging ke service eksternal
    // seperti Sentry, LogRocket, dll.
  }

  /**
   * Fungsi untuk reset error state
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  /**
   * Fungsi untuk reload halaman
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Jika ada custom fallback, gunakan itu
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Terjadi Kesalahan
              </h1>
              <p className="text-gray-600 mb-6">
                Aplikasi mengalami error yang tidak terduga. Silakan coba lagi atau muat ulang halaman.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detail Error (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-40">
                    <div className="font-bold mb-1">{this.state.error.name}:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Muat Ulang
                </button>
              </div>
              
              <div className="mt-4">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ← Kembali ke Beranda
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook untuk menangani error di functional component
 * @returns Object dengan fungsi untuk menangani error
 */
export function useErrorHandler() {
  /**
   * Fungsi untuk menangani error secara manual
   * @param error - Error yang terjadi
   * @param errorInfo - Informasi tambahan tentang error
   */
  const handleError = (error: Error, errorInfo?: any): void => {
    console.error('Manual error handling:', error, errorInfo);
    
    // Di sini bisa ditambahkan logging ke service eksternal
    // atau menampilkan toast notification
  };

  /**
   * Fungsi untuk wrap async function dengan error handling
   * @param asyncFn - Async function yang akan di-wrap
   * @returns Wrapped function
   */
  const withErrorHandling = <T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error as Error);
        return undefined;
      }
    };
  };

  return {
    handleError,
    withErrorHandling,
  };
}