"use client";
import React from 'react';

/**
 * Interface untuk props ShimmerEffect
 */
interface ShimmerEffectProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Interface untuk props ShimmerCard
 */
interface ShimmerCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showButton?: boolean;
  className?: string;
}

/**
 * Interface untuk props ShimmerTable
 */
interface ShimmerTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Interface untuk props ShimmerList
 */
interface ShimmerListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Komponen dasar ShimmerEffect untuk animasi shimmer
 * Memberikan efek loading skeleton yang modern
 * 
 * @param className - CSS class tambahan
 * @param children - Konten di dalam shimmer
 */
const ShimmerEffect: React.FC<ShimmerEffectProps> = ({ className = '', children }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
};

/**
 * Komponen ShimmerBox untuk kotak loading sederhana
 * 
 * @param className - CSS class untuk styling
 */
export const ShimmerBox: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-200 rounded-md ${className}`} />
  );
};

/**
 * Komponen ShimmerCard untuk loading card/kartu
 * Menampilkan skeleton loading untuk komponen card
 * 
 * @param showImage - Tampilkan placeholder gambar
 * @param showTitle - Tampilkan placeholder judul
 * @param showDescription - Tampilkan placeholder deskripsi
 * @param showButton - Tampilkan placeholder tombol
 * @param className - CSS class tambahan
 */
export const ShimmerCard: React.FC<ShimmerCardProps> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showButton = false,
  className = ''
}) => {
  return (
    <ShimmerEffect className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Image placeholder */}
      {showImage && (
        <div className="flex items-center justify-between mb-4">
          <ShimmerBox className="w-12 h-12 rounded-lg" />
          <ShimmerBox className="w-20 h-6 rounded-full" />
        </div>
      )}
      
      {/* Title placeholder */}
      {showTitle && (
        <ShimmerBox className="h-6 mb-3 w-3/4" />
      )}
      
      {/* Description placeholder */}
      {showDescription && (
        <div className="space-y-2 mb-4">
          <ShimmerBox className="h-4 w-full" />
          <ShimmerBox className="h-4 w-5/6" />
          <ShimmerBox className="h-4 w-4/6" />
        </div>
      )}
      
      {/* Button placeholder */}
      {showButton && (
        <ShimmerBox className="h-10 w-32 rounded-lg" />
      )}
    </ShimmerEffect>
  );
};

/**
 * Komponen ShimmerTable untuk loading tabel
 * Menampilkan skeleton loading untuk komponen tabel
 * 
 * @param rows - Jumlah baris yang ditampilkan
 * @param columns - Jumlah kolom yang ditampilkan
 * @param className - CSS class tambahan
 */
export const ShimmerTable: React.FC<ShimmerTableProps> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <ShimmerEffect className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <ShimmerBox key={index} className="h-4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <ShimmerBox key={colIndex} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ShimmerEffect>
  );
};

/**
 * Komponen ShimmerList untuk loading daftar item
 * Menampilkan skeleton loading untuk komponen list
 * 
 * @param items - Jumlah item yang ditampilkan
 * @param showAvatar - Tampilkan placeholder avatar
 * @param className - CSS class tambahan
 */
export const ShimmerList: React.FC<ShimmerListProps> = ({
  items = 5,
  showAvatar = true,
  className = ''
}) => {
  return (
    <ShimmerEffect className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm">
          {/* Avatar placeholder */}
          {showAvatar && (
            <ShimmerBox className="w-10 h-10 rounded-full flex-shrink-0" />
          )}
          
          {/* Content placeholder */}
          <div className="flex-1 space-y-2">
            <ShimmerBox className="h-4 w-3/4" />
            <ShimmerBox className="h-3 w-1/2" />
          </div>
          
          {/* Action placeholder */}
          <ShimmerBox className="w-20 h-8 rounded-md" />
        </div>
      ))}
    </ShimmerEffect>
  );
};

/**
 * Komponen ShimmerForm untuk loading form
 * Menampilkan skeleton loading untuk komponen form
 */
export const ShimmerForm: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <ShimmerEffect className={`bg-white rounded-lg shadow-md p-6 space-y-6 ${className}`}>
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <ShimmerBox className="h-4 w-24" />
          <ShimmerBox className="h-10 w-full rounded-md" />
        </div>
      ))}
      
      {/* Submit button */}
      <div className="flex justify-end space-x-3">
        <ShimmerBox className="h-10 w-20 rounded-md" />
        <ShimmerBox className="h-10 w-24 rounded-md" />
      </div>
    </ShimmerEffect>
  );
};

export default ShimmerEffect;