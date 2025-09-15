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
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          // Hapus data yang corrupt dari localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
    }
  }, []);
  
  /**
   * Fungsi untuk logout user dan redirect ke halaman login
   */
  const logout = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      const { logoutUser } = await import('@/lib/api');
      
      try {
        await logoutUser();
      } catch (error) {
        console.error('Logout error:', error);
      }
      
      router.push('/login');
    }
  };
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
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
      {/* Spacer to prevent content from being covered by fixed header */}
      <div className="h-14" aria-hidden="true" />
    </>
  );
}

export default Header;
