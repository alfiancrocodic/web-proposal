"use client";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { registerUser } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useErrorHandler } from '@/components/ErrorBoundary';

/**
 * Interface untuk form register
 */
interface RegisterForm {
  name: string;
  email: string;
  jabatan: string;
  password: string;
  password_confirmation: string;
}

/**
 * Komponen halaman register
 * Menampilkan form register dengan background image dan redirect setelah register
 */
export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    jabatan: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { showSuccess, showError, showWarning, ToastContainer } = useToast();
  const { withErrorHandling } = useErrorHandler();
  
  /**
   * Fungsi untuk handle submit form register
   * @param e - Form submit event
   */
  const onSubmit = withErrorHandling(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validasi field kosong
    if (!form.name || !form.email || !form.jabatan || !form.password || !form.password_confirmation) {
      const errorMessage = 'Semua field harus diisi';
      setError(errorMessage);
      showWarning(errorMessage);
      setLoading(false);
      return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      const errorMessage = 'Format email tidak valid';
      setError(errorMessage);
      showWarning(errorMessage);
      setLoading(false);
      return;
    }
    
    // Validasi password confirmation
    if (form.password !== form.password_confirmation) {
      const errorMessage = 'Password dan konfirmasi password tidak sama';
      setError(errorMessage);
      showWarning(errorMessage);
      setLoading(false);
      return;
    }
    
    // Validasi panjang password
    if (form.password.length < 6) {
      const errorMessage = 'Password minimal 6 karakter';
      setError(errorMessage);
      showWarning(errorMessage);
      setLoading(false);
      return;
    }
    
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        jabatan: form.jabatan,
        password: form.password,
        password_confirmation: form.password_confirmation
      });
      
      const successMessage = 'Registrasi berhasil! Mengalihkan ke halaman login...';
      setSuccess(successMessage);
      showSuccess(successMessage);
      
      // Reset form
      setForm({
        name: '',
        email: '',
        jabatan: '',
        password: '',
        password_confirmation: ''
      });
      
      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
          <h2 className="text-2xl font-bold text-gray-900">Register</h2>
          <p className="text-gray-600 mt-2">Create your account to get started.</p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              id="name"
              type="text" 
              required 
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (error) setError('');
              }}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Work Email</label>
            <input 
              id="email"
              type="email" 
              required 
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (error) setError('');
              }}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <div>
            <label htmlFor="jabatan" className="block text-sm font-medium text-gray-700">Jabatan</label>
            <input 
              id="jabatan"
              type="text" 
              required 
              value={form.jabatan}
              onChange={(e) => {
                setForm({ ...form, jabatan: e.target.value });
                if (error) setError('');
              }}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              id="password"
              type="password" 
              required 
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (error) setError('');
              }}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input 
              id="password_confirmation"
              type="password" 
              required 
              value={form.password_confirmation}
              onChange={(e) => {
                setForm({ ...form, password_confirmation: e.target.value });
                if (error) setError('');
              }}
              className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg text-black bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Login here
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