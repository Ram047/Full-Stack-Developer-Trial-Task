import React from 'react';
import Link from 'next/link';
import { ChevronRight, Shield, TrendingUp, Cpu, Command, Database, Award, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PipelineIQ - CRM & Sales Pipeline Forecasting for B2B Teams',
  description: 'Manage sales pipelines, predict weighted forecasts, and track activity logs with role-based security. Built for high-growth B2B revenue operations.',
  alternates: {
    canonical: 'http://localhost:3000',
  },
};

export default function LandingPage() {
  // Structured Data (JSON-LD) for SoftwareApplication and FAQPage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'http://localhost:3000/#application',
        'name': 'PipelineIQ',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'price': '0.00',
          'priceCurrency': 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'http://localhost:3000/#faq',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'What database does PipelineIQ use?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'PipelineIQ uses SQLite with Prisma ORM for efficient, local development and testing, but can be scaled to PostgreSQL for production workloads.',
            },
          },
          {
            '@type': 'Question',
            'name': 'Does PipelineIQ support role-based permissions?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. PipelineIQ enforces strict server-side Role-Based Access Control (RBAC) with four pre-defined roles: Owner, Admin, Member, and Viewer.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld-json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Layout Container */}
      <div className="bg-[#030712] text-slate-100 min-h-screen flex flex-col font-sans">
        
        {/* Semantic Header */}
        <header className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-md border-b border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Command className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                PipelineIQ
              </span>
            </div>

            <nav aria-label="Global navigation" className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#security" className="hover:text-white transition-colors">Security</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900/60"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg shadow-md shadow-emerald-500/10 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Semantic Main Content */}
        <main className="flex-1">
          
          {/* Hero Section */}
          <section className="relative pt-20 pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Trial Release 1.0.0 Now Active</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
                Predictive Sales Forecasting <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500">
                  Built for High-Growth Teams
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Streamline deals, execute optimistic drag-and-drop pipeline edits, and analyze weighted probability projections with real-time RBAC security enforcement.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-slate-900/60 hover:bg-slate-800/80 text-white border border-slate-800 font-bold px-7 py-3.5 rounded-xl transition-all"
                >
                  Access Demo Login
                </Link>
              </div>

              {/* Visual App Mockup Area */}
              <div className="mt-16 relative mx-auto max-w-5xl rounded-xl border border-slate-800 bg-slate-950 p-2.5 shadow-2xl shadow-emerald-500/5 aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                <div className="h-full w-full bg-slate-900 rounded-lg border border-slate-800/60 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Grid background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
                  
                  {/* Fake UI elements */}
                  <div className="relative z-20 text-center px-4">
                    <TrendingUp className="h-12 w-12 text-emerald-400 mx-auto animate-bounce duration-1000" />
                    <p className="mt-4 text-sm font-semibold text-white font-mono uppercase tracking-widest">Weighted Forecast Dashboard</p>
                    <p className="text-xs text-slate-500 mt-1.5">Interactive Deal Boards • Keyset Table Sorting • CSV Stream Exports • Token Limit Buckets</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Grid Section */}
          <section id="features" className="py-24 border-t border-slate-900/80 bg-slate-950/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white tracking-tight">Full Stack Operations Infrastructure</h2>
                <p className="mt-4 text-slate-400">Everything needed to run professional-grade sales operations out of the box.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                
                {/* Feature 1 */}
                <div className="p-6 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-700 transition-all group">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Weighted Forecasting</h3>
                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    View active pipelines adjusted by stage conversion probabilities to produce accurate revenue expectations.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-6 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-700 transition-all group">
                  <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Command className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Command Palette</h3>
                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    Instantly jump to views, search deals, create items, and review helper shortcuts using our keyboard-accessibleCmd+K panel.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-6 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-700 transition-all group">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Optimistic Kanban</h3>
                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    Draggable workflow columns update state instantly with automatic rollback mechanisms and undo toasts on server communication slips.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Access Section */}
          <section id="security" className="py-24 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Enterprise Security Compliance</span>
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Custom Session Security Shield</h2>
                <p className="text-slate-400 leading-relaxed">
                  Engineered with server-enforced security models that avoid reliance on default client-side trust frameworks:
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300">
                  <li className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Argon2id/Bcrypt password hashing (cost factor ≥12)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>httpOnly, Secure, SameSite=Lax session cookie validation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Strict session rotation on logins and privilege adjustments</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Token bucket rate limit protection mapping IPs & accounts</span>
                  </li>
                </ul>
              </div>

              <div className="flex-1 bg-slate-900 border border-slate-850 p-6 rounded-xl w-full">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest font-mono">Server Audit Activity</h3>
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-start text-xs border-l-2 border-emerald-500 pl-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-semibold font-mono">AUTH:LOGIN</span>
                      <span className="text-slate-400 mt-0.5">Session initialized. ID rotated.</span>
                    </div>
                    <span className="text-slate-500 font-mono">16:05:26</span>
                  </div>
                  <div className="flex justify-between items-start text-xs border-l-2 border-purple-500 pl-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-semibold font-mono">DEAL:UPDATE</span>
                      <span className="text-slate-400 mt-0.5">Optimistic stage: NEGOTIATION</span>
                    </div>
                    <span className="text-slate-500 font-mono">16:05:42</span>
                  </div>
                  <div className="flex justify-between items-start text-xs border-l-2 border-rose-500 pl-3">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-semibold font-mono">DEAL:DELETE</span>
                      <span className="text-slate-400 mt-0.5">Soft delete applied. (deletedAt written)</span>
                    </div>
                    <span className="text-slate-500 font-mono">16:05:59</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="py-24 border-t border-slate-900 bg-slate-950/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-white tracking-tight mb-16">Frequently Asked Questions</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white">How does email verification work in development?</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    To make testing completely zero-friction, a simulated mailer interceptor logs all verification codes and reset links directly to the console output of your running server. You can copy the code/link from there to verify immediately.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">What roles are defined in the RBAC hierarchy?</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    We support four roles: Owner (full read/write and settings), Admin (full deal CRUD and user management), Member (standard CRUD for deals and accounts), and Viewer (read-only access to all dashboards and lists, with all mutation endpoints blocked server-side).
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Semantic Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">PipelineIQ</span>
              <span>© {new Date().getFullYear()} Digital Heroes Program. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-350">GitHub</a>
              <Link href="/auth/login" className="hover:text-slate-350">Demo Credentials</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
