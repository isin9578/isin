'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  HandCoins,
  Shield,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  CalendarRange,
} from 'lucide-react';

interface AppShellProps {
  demoMode: boolean;
  children: React.ReactNode;
}

const NAV_SECTIONS: {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}[] = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Paluwagan (Savings Pool)',
    items: [
      { href: '/members', label: 'Members', icon: Users },
      { href: '/cycles', label: 'Cycles & Slots', icon: CalendarRange },
      { href: '/contributions', label: 'Contributions', icon: HandCoins },
      { href: '/distributions', label: 'Distributions', icon: Wallet },
    ],
  },
  {
    label: 'Protection & Comms',
    items: [
      { href: '/insurance', label: 'Insurance & Claims', icon: Shield },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ demoMode, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            iS
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight text-white">iSIN</div>
            <div className="text-[11px] leading-tight text-slate-400">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.label}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-slate-800 text-white shadow-sm ring-1 ring-brand-500/40'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? 'text-brand-400' : 'text-slate-400'}`} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">System Admin</div>
              <div className="truncate text-xs text-slate-400">admin@isin.ph</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white lg:hidden">
                iS
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">iSIN — Save Today, Be Protected Tomorrow</div>
                <div className="text-xs text-slate-500">Paluwagan pools &amp; micro-insurance administration</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {demoMode && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Demo mode — in-memory data
                </span>
              )}
              <button
                onClick={logout}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Compact nav (mobile / tablet) */}
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
            {NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                    active ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
