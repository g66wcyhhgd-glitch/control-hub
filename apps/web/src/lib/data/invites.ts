// apps/web/src/lib/data/invites.ts
import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type InviteRow = {
  id: string;
  email: string;
  role: 'owner' | 'member';
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
};

async function requireAuth(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user?.id) throw new Error('UNAUTHORIZED');
}

export async function listProjectInvites(projectId: string): Promise<InviteRow[]> {
  await requireAuth();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('list_project_invites', {
    p_project_id: projectId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as InviteRow[];
}

export async function createInvite(input: {
  projectId: string;
  email: string;
  role: 'owner' | 'member';
}): Promise<string> {
  await requireAuth();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('create_project_invite', {
    p_project_id: input.projectId,
    p_email: input.email,
    p_role: input.role,
  });

  if (error) throw new Error(error.message);
  return String(data);
}

export async function setInviteStatus(input: {
  inviteId: string;
  status: 'pending' | 'accepted' | 'expired';
}): Promise<void> {
  await requireAuth();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('set_invite_status', {
    p_invite_id: input.inviteId,
    p_status: input.status,
  });

  if (error) throw new Error(error.message);
}

export async function acceptInvite(input: { inviteId: string }): Promise<string> {
  await requireAuth();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('accept_invite', {
    p_invite_id: input.inviteId,
  });

  if (error) throw new Error(error.message);

  // returns project_id (uuid)
  return String(data);
}
