'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log stack trace server-side or log locally (requirement)
    console.error('Unhandled Application Error Boundary triggered:', error);
  }, [error]);

  return (
    <div className="bg-[#030712] min-h-screen text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-6 text-center animate-in zoom-in-95 duration-150">
        
        {/* Warning Icon */}
        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred while rendering this view. The stack trace has been logged to the server logs.
          </p>
        </div>

        {/* Error Info Card */}
        <div className="bg-slate-950 p-4 rounded-lg text-left border border-slate-850">
          <p className="text-xs font-semibold text-rose-400 font-mono line-clamp-2">
            Error: {error.message || 'Unknown Application Error'}
          </p>
          {error.digest && (
            <p className="text-[10px] text-slate-500 font-mono mt-1">Digest: {error.digest}</p>
          )}
        </div>

        {/* Actions panel */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg shadow-md transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
