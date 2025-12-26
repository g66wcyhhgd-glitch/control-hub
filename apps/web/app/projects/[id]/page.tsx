import { notFound } from 'next/navigation';

import { getProjectById, listProjectMembers } from '@/lib/data/projects';
import { archiveProjectAction, openProjectAction, renameProjectAction } from '../actions';
import { addMemberAction, removeMemberAction } from './member-actions';

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

        <form
          action={addMemberAction}
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <input type="hidden" name="projectId" value={project.id} />
          <input
            name="userId"
            placeholder="user_id (uuid)"
            required
            style={{ minWidth: 320 }}
          />
          <select name="role" defaultValue="member">
            <option value="member">member</option>
            <option value="owner">owner</option>
          </select>
          <button type="submit">Add member</button>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            UUID пользователя бери в Supabase → Authentication → Users.
          </div>
        </form>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ padding: 8 }}>user_id</th>
                <th style={{ padding: 8 }}>role</th>
                <th style={{ padding: 8 }}>created_at</th>
                <th style={{ padding: 8 }}>actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 8, fontFamily: 'monospace' }}>{m.user_id}</td>
                  <td style={{ padding: 8 }}>
                    <b>{m.role_in_project}</b>
                  </td>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{m.created_at}</td>
                  <td style={{ padding: 8 }}>
                    <form action={removeMemberAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="userId" value={m.user_id} />
                      <button type="submit">Remove</button>
                    </form>
                  </td>
                </tr>
              ))}

              {members.length === 0 && (
                <tr>
                  <td style={{ padding: 12 }} colSpan={4}>
                    No members
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
          Важно: добавлять/удалять участников сможет только владелец проекта (owner) или admin — так настроен RLS.
        </div>
      </section>
    </main>
  );
}
