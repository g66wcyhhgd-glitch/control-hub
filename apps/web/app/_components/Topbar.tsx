import Link from 'next/link';

import { getMyProjects } from '@/lib/data/projects';
import { getActiveProjectId } from '@/lib/projects/active-project';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { setActiveProjectAction, clearActiveProjectAction } from '../projects/actions';
import { signOutAction } from '../auth/actions';

export default async function Topbar() {
  try {
    // Если env не настроены — просто показываем минимум, без падения
    const hasEnv =
      !!(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
      !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);

    if (!hasEnv) {
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>CONTROL HUB</div>
            <Link href="/projects">Projects</Link>
          </div>
          <div style={{ fontSize: 14, color: 'crimson' }}>Missing Supabase ENV</div>
        </div>
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? null;

    const [projects, activeId] = await Promise.all([getMyProjects(), getActiveProjectId()]);
    const active = activeId ? projects.find((p) => p.id === activeId) : null;

    return (
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 700 }}>CONTROL HUB</div>
          <Link href="/projects">Projects</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!user ? (
            <Link href="/login">Login</Link>
          ) : (
            <>
              <div style={{ fontSize: 14 }}>
                Active project: <b>{active ? `${active.name} (${active.project_key})` : 'Not selected'}</b>
              </div>

              <form action={setActiveProjectAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select name="projectId" defaultValue={active?.id ?? ''}>
                  <option value="" disabled>
                    Select project…
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.project_key}
                    </option>
                  ))}
                </select>
                <button type="submit">Set</button>
              </form>

              <form action={clearActiveProjectAction}>
                <button type="submit" disabled={!activeId}>
                  Clear
                </button>
              </form>

              <form action={signOutAction}>
                <button type="submit">Logout</button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  } catch (e) {
    console.error('Topbar server error:', e);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>CONTROL HUB</div>
          <Link href="/projects">Projects</Link>
        </div>
        <div style={{ fontSize: 14, color: 'crimson' }}>Topbar error (see Vercel Logs)</div>
      </div>
    );
  }
}
