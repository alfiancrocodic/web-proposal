"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

/**
 * Interface untuk data user
 */
interface User {
  id: number;
  name: string;
  nama: string;
  email: string;
  jabatan: string;
}

/**
 * Komponen Header untuk navigasi utama aplikasi
 * Menampilkan logo, judul aplikasi, dan tombol navigasi
 */
function Header(): React.JSX.Element {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);
  
  /**
   * Fungsi untuk logout user dan redirect ke halaman login
   */
  const logout = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      
      // Call logout API
      if (token) {
        try {
          await fetch('http://localhost:8000/api/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      }
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-3">
            <Image src="/ic_logo_crocodic_square.png" alt="Logo" width={32} height={32} className="rounded" />
            <span className="font-semibold">Proposal Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-sm text-gray-600 hover:text-black">Home</button>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.nama || user.name}</span>
                <span className="text-xs text-gray-500">({user.jabatan})</span>
              </div>
            )}
            <button onClick={logout} className="text-sm text-gray-600 hover:text-black">Logout</button>
            {/* Fallback to local avatar to avoid remote host issues */}
            <Image src="/vercel.svg" alt="User" width={32} height={32} className="rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
