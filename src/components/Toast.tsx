"use client";
import React, { useEffect, useState } from 'react';

/**
 * Interface untuk toast notification
 */
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

/**
 * Komponen Toast untuk menampilkan notifikasi
 * @param props - Props untuk toast
 * @returns React component untuk toast notification
 */
export default function Toast({ message, type, duration = 5000, onClose }: ToastProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  /**
   * Fungsi untuk mendapatkan style berdasarkan type toast
   * @returns String class CSS
   */
  const getToastStyle = (): string => {
    const baseStyle = 'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 z-50 max-w-md';
    
    switch (type) {
      case 'success':
        return `${baseStyle} bg-green-500 text-white`;
      case 'error':
        return `${baseStyle} bg-red-500 text-white`;
      case 'warning':
        return `${baseStyle} bg-yellow-500 text-black`;
      case 'info':
        return `${baseStyle} bg-blue-500 text-white`;
      default:
        return `${baseStyle} bg-gray-500 text-white`;
    }
  };

  /**
   * Fungsi untuk mendapatkan icon berdasarkan type toast
   * @returns String icon
   */
  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  if (!isVisible) {
    return <></>;
  }

  return (
    <div className={getToastStyle()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-lg">{getIcon()}</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-4 text-lg hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Hook untuk menggunakan toast notifications
 * @returns Object dengan fungsi untuk menampilkan toast
 */
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>>([]);

  /**
   * Fungsi untuk menampilkan toast
   * @param message - Pesan toast
   * @param type - Tipe toast
   * @param duration - Durasi tampil toast
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration?: number
  ): void => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  /**
   * Fungsi untuk menghapus toast
   * @param id - ID toast yang akan dihapus
   */
  const removeToast = (id: string): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  /**
   * Komponen ToastContainer untuk menampilkan semua toast
   * @returns React component untuk container toast
   */
  const ToastContainer = (): React.JSX.Element => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return {
    showToast,
    ToastContainer,
    showSuccess: (message: string, duration?: number) => showToast(message, 'success', duration),
    showError: (message: string, duration?: number) => showToast(message, 'error', duration),
    showWarning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    showInfo: (message: string, duration?: number) => showToast(message, 'info', duration),
  };
}