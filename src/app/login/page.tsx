"use client";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { loginUser } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useErrorHandler } from '@/components/ErrorBoundary';

/**
 * Interface untuk form login
 */
interface LoginForm {
  email: string;
  password: string;
}

/**
 * Komponen halaman login
 * Menampilkan form login dengan background image dan redirect setelah login
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { showSuccess, showError, ToastContainer } = useToast();
  const { withErrorHandling } = useErrorHandler();
  
  /**
   * Fungsi untuk handle submit form login
   * @param e - Form submit event
   */
  const onSubmit = withErrorHandling(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await loginUser(form.email, form.password);
      
      // Simpan token ke localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showSuccess('Login berhasil! Mengalihkan ke dashboard...');
      
      // Delay sedikit untuk menampilkan toast
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  });
  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-blue-800 opacity-60" />
      <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/ic_logo_crocodic_square.png" width={32} height={32} alt="Logo" className="rounded" />
          <h1 className="text-xl font-bold">Proposal Manager</h1>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          <p className="text-gray-600 mt-2">Welcome back! Please sign in.</p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Email</label>
            <input 
              type="email" 
              required 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required 
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg text-black bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              Register here
            </Link>
          </p>
        </div>
      </div>
      <footer className="absolute bottom-4 text-center text-sm text-white">
        Copyright ©2025. All rights reserved.
      </footer>
      <ToastContainer />
    </div>
  );
}

