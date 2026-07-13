'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Command, ArrowRight, ShieldAlert, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { LoginSchema } from '@/lib/validation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setRetryAfter(null);

    // Client-side Zod validation
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryHeader = response.headers.get('Retry-After');
          const delay = retryHeader ? parseInt(retryHeader, 10) : 60;
          setRetryAfter(delay);
          throw new Error(data.error || 'Too many attempts. Rate limited.');
        }
        throw new Error(data.error || 'Invalid credentials');
      }

      // Check if email is verified
      if (!data.user.emailVerified) {
        // Redirect to verification view (which can be inside dashboard or a dedicated page)
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#030712] min-h-screen text-slate-100 flex items-center justify-center p-4">
      {/* Container Box */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 relative">
        
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />

        {/* Logo and title */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <Command className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">PipelineIQ</span>
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Access your deals and forecasting dashboards</p>
        </div>

        {/* Credentials reminder alert */}
        <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-lg mt-6 flex items-start gap-3 text-xs text-slate-400">
          <ShieldAlert className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200">Try Seeded Demo Access:</span>
            <span className="font-mono text-slate-350 mt-1">Username: demo@demo.com</span>
            <span className="font-mono text-slate-350">Password: demo1234</span>
            <span className="text-[10px] text-emerald-500/80 mt-1">*View-only role. Non-destructive evaluation.</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 mt-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block" htmlFor="password">
                Password
              </label>
              <Link href="/auth/reset-password" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Errors display */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">
              {error}
              {retryAfter !== null && (
                <div className="mt-1 font-semibold text-rose-500">
                  Please retry in {retryAfter} seconds.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-slate-950 font-bold py-3 rounded-lg shadow-md transition-colors text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-850/60">
          <span>New user? </span>
          <Link href="/auth/register" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
