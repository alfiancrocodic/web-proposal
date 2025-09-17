"use client";
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Interface untuk props LoadingOverlay
 */
interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red';
  backdrop?: 'light' | 'dark' | 'blur';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Komponen LoadingOverlay untuk menampilkan overlay loading
 * Dapat digunakan untuk menutupi seluruh halaman atau area tertentu
 * 
 * @param isVisible - Menentukan apakah overlay ditampilkan
 * @param text - Teks yang ditampilkan di bawah spinner
 * @param size - Ukuran spinner
 * @param color - Warna spinner
 * @param backdrop - Jenis backdrop (light, dark, blur)
 * @param className - CSS class tambahan
 * @param children - Konten kustom yang akan ditampilkan
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = 'Loading...',
  size = 'lg',
  color = 'blue',
  backdrop = 'light',
  className = '',
  children
}) => {
  if (!isVisible) return null;

  // Konfigurasi backdrop
  const backdropClasses = {
    light: 'bg-white bg-opacity-80',
    dark: 'bg-black bg-opacity-50',
    blur: 'bg-white bg-opacity-70 backdrop-blur-sm'
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${backdropClasses[backdrop]}
        ${className}
      `}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center justify-center p-8">
        {children || (
          <LoadingSpinner
            size={size}
            color={color}
            text={text}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Komponen LoadingContainer untuk loading area tertentu
 * Digunakan untuk menampilkan loading di dalam container tertentu
 */
interface LoadingContainerProps {
  isLoading: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red';
  className?: string;
  children: React.ReactNode;
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  isLoading,
  text = 'Loading...',
  size = 'md',
  color = 'blue',
  className = '',
  children
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
          <LoadingSpinner
            size={size}
            color={color}
            text={text}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Komponen LoadingButton untuk tombol dengan state loading
 */
interface LoadingButtonProps {
  isLoading: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  children
}) => {
  // Konfigurasi variant
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  // Konfigurasi ukuran
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center
        rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {isLoading && (
        <LoadingSpinner
          size="sm"
          color="white"
          className="mr-2"
        />
      )}
      {children}
    </button>
  );
};

export default LoadingOverlay;