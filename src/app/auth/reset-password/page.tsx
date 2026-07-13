'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Command, ArrowRight, Mail, KeyRound, RefreshCw, Key } from 'lucide-react';
import { ResetRequestSchema, ResetPasswordSchema } from '@/lib/validation';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const result = ResetRequestSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to request reset');

      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Invalid reset token.');
      setLoading(false);
      return;
    }

    const result = ResetPasswordSchema.safeParse({ token, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reset password');

      setMessage(data.message);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isResetMode = !!token;

  return (
    <div className="bg-[#030712] min-h-screen text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 relative">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />

        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
              <Command className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">PipelineIQ</span>
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isResetMode ? 'Set New Password' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isResetMode
              ? 'Enter a strong, secure password below'
              : 'Request a reset token logged to the terminal'}
          </p>
        </div>

        {message ? (
          <div className="space-y-6 mt-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Key className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Success</h3>
              <p className="text-xs text-slate-450 px-2 leading-relaxed">
                {message}
              </p>
            </div>
            {!isResetMode && (
              <Link
                href="/auth/login"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors text-sm flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <span>Back to Login</span>
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={isResetMode ? handleExecuteReset : handleRequestReset} className="space-y-4 mt-6">
            {!isResetMode ? (
              // Request Reset Form
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
            ) : (
              // Execute Reset Form
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">
                {error}
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
                  <span>{isResetMode ? 'Reset Password' : 'Send Reset Link'}</span>
                  <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-850/60">
          <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#030712] min-h-screen text-slate-150 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
