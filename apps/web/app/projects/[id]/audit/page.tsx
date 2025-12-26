import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getProjectById } from '@/lib/data/projects';
import { listAuditEvents } from '@/lib/data/audit';

export default async function ProjectAuditPage({ params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) notFound();

  const events = await listAuditEvents(project.id, 100);

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Audit</h1>
        <div style={{ opacity: 0.8 }}>
          for <b>{project.name}</b> ({project.project_key})
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href={`/projects/${project.id}`}>← Back to project</Link>
      </div>

      <section style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ padding: 8 }}>Time</th>
              <th style={{ padding: 8 }}>Event</th>
              <th style={{ padding: 8 }}>Actor</th>
              <th style={{ padding: 8 }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{e.created_at}</td>
                <td style={{ padding: 8 }}>{e.event_type}</td>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{e.actor_id ?? '—'}</td>
                <td style={{ padding: 8 }}>
                  <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(e.payload ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}

            {events.length === 0 && (
              <tr>
                <td style={{ padding: 12 }} colSpan={4}>
                  No audit events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
