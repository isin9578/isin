import { listNotifications } from '@/lib/data';
import { formatDateTime } from '@/lib/format';
import { EmptyRow, PageHeader, Panel, StatusBadge, TD, TH, Table } from '@/components/ui';
import BroadcastForm from './BroadcastForm';

export default async function NotificationsPage() {
  const notifications = await listNotifications(50);
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Notifications & Announcements"
        subtitle="Push system announcements or contribution reminders straight to member devices."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Compose notification" className="lg:col-span-1">
          <div className="px-4 py-4">
            <BroadcastForm />
          </div>
        </Panel>

        <Panel
          title="Delivery log"
          className="lg:col-span-2"
          actions={
            <span className="text-xs text-slate-500">
              last {notifications.length} messages · {unread} unread by members
            </span>
          }
        >
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <TH>Recipient</TH>
                <TH>Title</TH>
                <TH>Message</TH>
                <TH>Type</TH>
                <TH>State</TH>
                <TH>Sent</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.length === 0 && (
                <EmptyRow colSpan={6} label="Nothing sent yet." />
              )}
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/60">
                  <TD>
                    <div className="text-sm font-medium text-slate-900">{n.member_name}</div>
                  </TD>
                  <TD className="text-xs font-medium text-slate-700">{n.title}</TD>
                  <TD className="max-w-sm">
                    <p className="line-clamp-2 text-xs text-slate-600">{n.message}</p>
                  </TD>
                  <TD>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                      {n.type.replace(/_/g, ' ')}
                    </span>
                  </TD>
                  <TD>
                    <StatusBadge status={n.is_read ? 'completed' : 'pending'} />
                    <span className="ml-1.5 text-[11px] text-slate-400">
                      {n.is_read ? 'read' : 'unread'}
                    </span>
                  </TD>
                  <TD className="text-xs text-slate-600">{formatDateTime(n.created_at)}</TD>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Members control what they receive from Notification Settings in the mobile app —
        opted-out types are filtered automatically. The delivery log lists every message queued per member.
      </p>
    </div>
  );
}
