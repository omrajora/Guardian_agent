import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import {
  ShieldAlert,
  Activity,
  CheckCircle,
  FileText,
  Sliders,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guardian Agent 2.0 — AI Security & Risk Gateway',
  description: 'Runtime security gateway and risk governance for autonomous AI agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-background text-slate-100">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-surface-border bg-surface/80 backdrop-blur flex flex-col justify-between shrink-0">
          <div>
            <div className="p-6 border-b border-surface-border flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold tracking-tight text-white flex items-center gap-1.5">
                  GUARDIAN <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">2.0</span>
                </h1>
                <p className="text-xs text-slate-400">AI Agent Security Gateway</p>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Overview</span>
              </Link>

              <Link
                href="/approvals"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Approvals Queue</span>
              </Link>

              <Link
                href="/policies"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Security Policies</span>
              </Link>

              <Link
                href="/agents"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Agents & Tools</span>
              </Link>

              <Link
                href="/audit"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Audit & Traces</span>
              </Link>

              <Link
                href="/simulator"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <Terminal className="w-4 h-4 text-rose-400" />
                <span>Attack Simulator</span>
              </Link>

              <Link
                href="/models"
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-elevated hover:text-white transition"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>ML Governance</span>
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-surface-border">
            <div className="p-3 rounded-lg bg-surface-elevated/60 border border-surface-border text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium">Gateway Active</span>
              </div>
              <span className="text-slate-400">v2.0-rc</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
