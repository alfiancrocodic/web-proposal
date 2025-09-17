"use client";
import React from 'react';

/**
 * Interface untuk props LoadingSpinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red';
  text?: string;
  className?: string;
}

/**
 * Komponen LoadingSpinner yang modern dan responsif
 * Menampilkan animasi loading dengan berbagai ukuran dan warna
 * 
 * @param size - Ukuran spinner (sm, md, lg, xl)
 * @param color - Warna spinner (blue, white, gray, green, red)
 * @param text - Teks yang ditampilkan di bawah spinner
 * @param className - CSS class tambahan
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  className = ''
}) => {
  // Konfigurasi ukuran spinner
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Konfigurasi warna spinner
  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600'
  };

  // Konfigurasi warna teks
  const textColorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Spinner dengan animasi */}
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          border-4 border-t-transparent border-solid rounded-full
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      
      {/* Teks loading jika disediakan */}
      {text && (
        <p className={`mt-3 text-sm font-medium ${textColorClasses[color]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;