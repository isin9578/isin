import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import LoginForm from './LoginForm';
import { getSessionContext } from '@/lib/auth';
import { isDemoMode } from '@/lib/env';

export default async function LoginPage() {
  const session = await getSessionContext();
  if (session?.isAdmin) redirect('/');

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-brand-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold">
            iS
          </div>
          <div className="text-2xl font-semibold">iSIN</div>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight">
            Save Today,
            <br />
            Be Protected Tomorrow.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-brand-100">
            Digital Paluwagan savings pools and micro-insurance for communities —
            pooled contributions, scheduled distributions, and member protection,
            administered in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-200">
          <ShieldCheck className="h-4 w-4" />
          Admin access only · RLS-protected Supabase backend
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 font-bold text-white">
                iS
              </div>
              <span className="text-xl font-semibold text-slate-900">iSIN</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Admin sign in</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Mobile number or email registered with iSIN.
          </p>
          <LoginForm demoMode={isDemoMode()} />
        </div>
      </div>
    </div>
  );
}
