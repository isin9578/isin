import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { getSessionContext } from '@/lib/auth';
import { isDemoMode } from '@/lib/env';

// Always render per-request: session state + demo-store mutations must be fresh.
export const dynamic = 'force-dynamic';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  if (!session?.isAdmin) redirect('/login');

  return <AppShell demoMode={isDemoMode()}>{children}</AppShell>;
}
