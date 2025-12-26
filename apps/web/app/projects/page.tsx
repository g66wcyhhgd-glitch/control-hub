import Link from 'next/link';

import { getMyProjects } from '@/lib/data/projects';
import { archiveProjectAction, createProjectAction, openProjectAction, renameProjectAction } from './actions';

export default async function ProjectsPage() {
  const projects = await getMyProjects();

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Projects</h1>

      <section style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Create project</h2>
        <form action={createProjectAction} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input name="project_key" placeholder="project_key (unique)" required />
          <input name="name" placeholder="name" required />
          <button type="submit">Create</button>
        </form>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
          project_key — уникальный и неизменяемый.
        </div>
      </section>

      <section style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Key</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Members</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 8 }}>
                  <Link href={`/projects/${p.id}`}>{p.name}</Link>
                </td>
                <td style={{ padding: 8 }}>{p.project_key}</td>
                <td style={{ padding: 8 }}>{p.status}</td>
                <td style={{ padding: 8 }}>{p.members_count}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <form action={openProjectAction}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <button type="submit">Open</button>
                    </form>

                    <form action={renameProjectAction} style={{ display: 'flex', gap: 6 }}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <input name="name" defaultValue={p.name} />
                      <button type="submit">Edit</button>
                    </form>

                    <form action={archiveProjectAction}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <button type="submit" disabled={p.status === 'archived'}>
                        Archive
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {projects.length === 0 && (
              <tr>
                <td style={{ padding: 12 }} colSpan={5}>
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
