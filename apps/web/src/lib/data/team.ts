// apps/web/src/lib/data/team.ts
import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TeamMember = {
  user_id: string;
  email: string;
  role_in_project: 'owner' | 'member';
  created_at: string;
};

async function getUserIdOrNull(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function getProjectTeam(projectId: string): Promise<TeamMember[]> {
  const userId = await getUserIdOrNull();
  if (!userId) return [];

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('get_project_team', {
    p_project_id: projectId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}

export async function changeMemberRole(input: {
  projectId: string;
  userId: string;
  role: 'owner' | 'member';
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const me = await getUserIdOrNull();
  if (!me) throw new Error('UNAUTHORIZED');

  const { error } = await supabase.rpc('change_member_role', {
    p_project_id: input.projectId,
    p_user_id: input.userId,
    p_role: input.role,
  });

  if (error) throw new Error(error.message);
}

export async function removeMember(input: {
  projectId: string;
  userId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const me = await getUserIdOrNull();
  if (!me) throw new Error('UNAUTHORIZED');

  const { error } = await supabase.rpc('remove_project_member', {
    p_project_id: input.projectId,
    p_user_id: input.userId,
  });

  if (error) throw new Error(error.message);
}
