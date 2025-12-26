import { getActiveProjectId } from '@/lib/projects/active-project';

export default async function DashboardPage() {
  const activeProjectId = await getActiveProjectId();

  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Dashboard (project module)</h1>
      <div>
        Active project id: <b>{activeProjectId ?? 'null'}</b>
      </div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Если active project не выбран — сюда должно редиректить на /projects.
      </div>
    </main>
  );
}
