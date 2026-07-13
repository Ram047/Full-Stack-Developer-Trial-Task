'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command, LogOut, LayoutDashboard, ClipboardList, Shield, RefreshCw } from 'lucide-react';
import { useToast } from './ui/Toast';

interface HeaderProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      addToast({
        type: 'success',
        title: 'Email Verified',
        description: 'Your write access has been fully enabled.',
      });
      
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        addToast({
          type: 'info',
          title: 'Signed Out',
          description: 'You have logged out successfully.',
        });
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MEMBER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="shrink-0">
      {/* 1. Email Verification sticky top bar */}
      {!user.emailVerified && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-rose-400 font-semibold flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>Email verification required! Copy the 6-digit code from your server console logs to verify.</span>
            </span>
            <form onSubmit={handleVerify} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white text-center font-mono font-bold w-24 outline-none focus:border-rose-500/50"
              />
              <button
                type="submit"
                disabled={verifying}
                className="bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 text-white font-bold px-3.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1"
              >
                {verifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Verify'}
              </button>
              {error && <span className="text-rose-500 font-medium ml-1">{error}</span>}
            </form>
          </div>
        </div>
      )}

      {/* 2. Top Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo and Nav links */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
                <Command className="h-4 w-4 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">PipelineIQ</span>
            </Link>

            <nav aria-label="App Navigation" className="hidden sm:flex items-center gap-6 text-sm text-slate-400 font-medium">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                  pathname === '/dashboard' ? 'text-white font-semibold' : ''
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/deals"
                className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                  pathname.startsWith('/deals') ? 'text-white font-semibold' : ''
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span>Deals</span>
              </Link>
            </nav>
          </div>

          {/* User details and log out */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-white">{user.name}</span>
              <span className={`text-[9px] font-bold border rounded px-1.5 mt-0.5 self-end ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};
