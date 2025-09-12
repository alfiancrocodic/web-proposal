"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth');
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
            <button onClick={logout} className="text-sm text-gray-600 hover:text-black">Logout</button>
            {/* Fallback to local avatar to avoid remote host issues */}
            <Image src="/vercel.svg" alt="User" width={32} height={32} className="rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
}
