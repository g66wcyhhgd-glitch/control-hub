import { notFound } from 'next/navigation';

import { getProjectById, listProjectMembers } from '@/lib/data/projects';
import { archiveProjectAction, openProjectAction, renameProjectAction } from '../actions';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) notFound();

  const members = await listProjectMembers(project.id);

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>{project.name}</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <form action={openProjectAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <button type="submit">Set as active</button>
        </form>

        <form action={renameProjectAction} style={{ display: 'flex', gap: 6 }}>
          <input type="hidden" name="projectId" value={project.id} />
          <input name="name" defaultValue={project.name} />
          <button type="submit">Rename</button>
        </form>

        <form action={archiveProjectAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <button type="submit" disabled={project.status === 'archived'}>
            Archive
          </button>
        </form>

        <a href={`/projects/${project.id}/audit`}>Audit</a>
      </div>

      <section style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 8 }}>
        <div>
          <b>project_key:</b> {project.project_key}
        </div>
        <div>
          <b>status:</b> {project.status}
        </div>
        <div>
          <b>created_at:</b> {project.created_at}
        </div>
      </section>

      <section style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Members</h2>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {members.map((m) => (
            <li key={m.user_id}>
              {m.user_id} — <b>{m.role_in_project}</b>
            </li>
          ))}
          {members.length === 0 && <li>No members</li>}
        </ul>
      </section>
    </main>
  );
}
