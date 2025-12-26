// apps/web/app/invites/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getActiveProjectId } from '@/lib/projects/active-project';
import { getProjectTeam } from '@/lib/data/team';
import { listProjectInvites } from '@/lib/data/invites';

import { acceptInviteAction, createInviteAction, expireInviteAction } from './actions';

export default async function InvitesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const me = data.user ?? null;

  const activeProjectId = await getActiveProjectId();

  // section A: accept invite (works even without active project)
  // section B: list/create invites (only if active project is selected AND user is Owner/Admin)

  let canManage = false;
  let invites: Awaited<ReturnType<typeof listProjectInvites>> = [];

  if (me && activeProjectId) {
    const [team, isAdminRes] = await Promise.all([
      getProjectTeam(activeProjectId),
      supabase.rpc('is_admin'),
    ]);

    const isAdmin = Boolean(isAdminRes.data);
    const myRole = team.find((m) => m.user_id === me.id)?.role_in_project ?? null;
    canManage = isAdmin || myRole === 'owner';

    if (canManage) {
      invites = await listProjectInvites(activeProjectId);
    }
  }

  return (
    <main style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Invites</h1>

      <section style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Accept invitation</h2>
        {!me ? (
          <div style={{ fontSize: 14, color: 'crimson' }}>
            You must be logged in to accept an invite.
          </div>
        ) : (
          <form action={acceptInviteAction} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input name="inviteId" placeholder="invite_id (uuid)" required style={{ minWidth: 360 }} />
            <button type="submit">Accept</button>
          </form>
        )}
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
          Приглашённый пользователь принимает инвайт по invite_id. После принятия — он добавляется в project_members и попадает в Team.
        </div>
      </section>

      <section style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Project invites (active project)</h2>

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Active project id:{' '}
          <span style={{ fontFamily: 'monospace' }}>{activeProjectId ?? 'null'}</span>
        </div>

        {!activeProjectId ? (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            No active project selected. Go to <a href="/projects">/projects</a> and set an active project.
          </div>
        ) : !me ? (
          <div style={{ marginTop: 10, fontSize: 14, color: 'crimson' }}>Login required.</div>
        ) : !canManage ? (
          <div style={{ marginTop: 10, fontSize: 14 }}>
            You have no access to manage invites (Owner/Admin only).
          </div>
        ) : (
          <>
            <form
              action={createInviteAction}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}
            >
              <input name="email" placeholder="email" type="email" required style={{ minWidth: 320 }} />
              <select name="role" defaultValue="member">
                <option value="member">member</option>
                <option value="owner">owner</option>
              </select>
              <button type="submit">Create invite</button>
            </form>

            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                    <th style={{ padding: 8 }}>Invite ID</th>
                    <th style={{ padding: 8 }}>Email</th>
                    <th style={{ padding: 8 }}>Role</th>
                    <th style={{ padding: 8 }}>Status</th>
                    <th style={{ padding: 8 }}>Created</th>
                    <th style={{ padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                      <td style={{ padding: 8, fontFamily: 'monospace' }}>{i.id}</td>
                      <td style={{ padding: 8 }}>{i.email}</td>
                      <td style={{ padding: 8 }}>
                        <b>{i.role}</b>
                      </td>
                      <td style={{ padding: 8 }}>{i.status}</td>
                      <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{i.created_at}</td>
                      <td style={{ padding: 8 }}>
                        {i.status === 'pending' ? (
                          <form action={expireInviteAction}>
                            <input type="hidden" name="inviteId" value={i.id} />
                            <button type="submit">Expire</button>
                          </form>
                        ) : (
                          <span style={{ fontSize: 12, opacity: 0.7 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {invites.length === 0 && (
                    <tr>
                      <td style={{ padding: 12 }} colSpan={6}>
                        No invites
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
              Invites list is visible only for Owner/Admin (RLS). Accepted invites create project_members.
            </div>
          </>
        )}
      </section>
    </main>
  );
}
