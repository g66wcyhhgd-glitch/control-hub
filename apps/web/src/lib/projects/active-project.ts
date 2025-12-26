// apps/web/src/lib/projects/active-project.ts
import 'server-only';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const COOKIE_NAME = 'ch_active_project_id';

export async function getActiveProjectId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Устанавливаем активный проект в cookie.
 * Перед установкой проверяем доступ к проекту через RLS (select projects).
 */
export async function setActiveProjectId(projectId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  if (!authData.user?.id) throw new Error('UNAUTHORIZED');

  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('FORBIDDEN_PROJECT');

  const c = await cookies();
  c.set(COOKIE_NAME, projectId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearActiveProjectId(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}
