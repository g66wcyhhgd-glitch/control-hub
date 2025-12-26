// apps/web/app/team/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireActiveProjectId } from '@/lib/projects/require-active-project';
import { getProjectTeam } from '@/lib/data/team';
import { changeRoleAction, removeMemberAction } from './actions';

export default async function TeamPage() {
  const projectId = await requireActiveProjectId();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const me = data.user ?? null;

  const [team, isAdminRes] = await Promise.all([
    getProjectTeam(projectId),
    supabase.rpc('is_admin'),
  ]);

  const isAdmin = Boolean(isAdminRes.data);
  const myRole = team.find((m) => m.user_id === me?.id)?.role_in_project ?? null;

  // Admin OR Project Owner can manage
  const canManage = isAdmin || myRole === 'owner';

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Team</h1>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Project scope: <span style={{ fontFamily: 'monospace' }}>{projectId}</span>
      </div>

      <section style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Role</th>
              <th style={{ padding: 8 }}>Added</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.user_id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                <td style={{ padding: 8 }}>{m.email}</td>
                <td style={{ padding: 8 }}>
                  <b>{m.role_in_project}</b>
                </td>
                <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{m.created_at}</td>
                <td style={{ padding: 8 }}>
                  {!canManage ? (
                    <span style={{ fontSize: 12, opacity: 0.7 }}>—</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <form action={changeRoleAction} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="hidden" name="userId" value={m.user_id} />
                        <select name="role" defaultValue={m.role_in_project}>
                          <option value="owner">owner</option>
                          <option value="member">member</option>
                        </select>
                        <button type="submit">Change role</button>
                      </form>

                      <form action={removeMemberAction}>
                        <input type="hidden" name="userId" value={m.user_id} />
                        <button type="submit">Remove</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {team.length === 0 && (
              <tr>
                <td style={{ padding: 12 }} colSpan={4}>
                  No members
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Rules: only Admin / Project Owner can change roles or remove members. Removing the only Owner is запрещено.
      </div>
    </main>
  );
}
