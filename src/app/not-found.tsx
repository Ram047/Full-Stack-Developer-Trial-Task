import React from 'react';
import Link from 'next/link';
import { Command, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-[#030712] min-h-screen text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
            <Command className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">PipelineIQ</span>
        </div>

        {/* 404 text */}
        <h1 className="text-7xl font-extrabold text-slate-650 font-mono tracking-widest">404</h1>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed px-4">
            The page you are looking for does not exist or has been moved. Use the navigation links to find your way back.
          </p>
        </div>

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg shadow-md transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
