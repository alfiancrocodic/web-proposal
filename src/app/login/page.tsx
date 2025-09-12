"use client";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React from 'react';

/**
 * Komponen halaman login
 * Menampilkan form login dengan background image dan redirect setelah login
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  
  /**
   * Fungsi untuk handle submit form login
   * @param e - Form submit event
   */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    localStorage.setItem('auth', '1');
    router.push('/');
  };
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
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Email</label>
            <input type="email" required className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required className="mt-1 block w-full px-4 py-3 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg text-black bg-yellow-400 hover:bg-yellow-500">Login</button>
        </form>
      </div>
      <footer className="absolute bottom-4 text-center text-sm text-white">
        Copyright ©2025. All rights reserved.
      </footer>
    </div>
  );
}

