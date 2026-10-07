import { listCycles, listMembers } from '@/lib/data';
import { PageHeader } from '@/components/ui';
import MembersClient from './MembersClient';

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const [members, cycles] = await Promise.all([listMembers(q), listCycles()]);

  const pending = members.filter((m) => m.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="Member Management"
        subtitle={
          pending > 0
            ? `${members.length} members · ${pending} awaiting approval`
            : `${members.length} registered members`
        }
      />
      <MembersClient members={members} cycles={cycles} query={q} />
    </div>
  );
}
