// apps/web/src/lib/data/projects.ts
import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ProjectStatus = 'active' | 'archived';

export type ProjectRow = {
  id: string;
  project_key: string;
  name: string;
  status: ProjectStatus;
  owner_id: string;
  created_at: string;
};

export type ProjectListItem = ProjectRow & {
  members_count: number;
};

function mustAuthUserId(userId: string | null | undefined): string {
  if (!userId) throw new Error('UNAUTHORIZED');
  return userId;
}

export async function getMyProjects(): Promise<ProjectListItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  // count участников через relation project_members
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id, project_key, name, status, owner_id, created_at,
      project_members(count)
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: any) => ({
    id: p.id,
    project_key: p.project_key,
    name: p.name,
    status: p.status,
    owner_id: p.owner_id,
    created_at: p.created_at,
    members_count: (p.project_members?.[0]?.count ?? 0) as number,
  }));
}

export async function getProjectById(projectId: string): Promise<ProjectRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  const { data, error } = await supabase
    .from('projects')
    .select('id, project_key, name, status, owner_id, created_at')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function createProject(input: { project_key: string; name: string }): Promise<ProjectRow> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  const userId = mustAuthUserId(authData.user?.id);

  const project_key = input.project_key.trim();
  const name = input.name.trim();

  if (!project_key) throw new Error('project_key is required');
  if (!name) throw new Error('name is required');

  // RLS insert policy требует owner_id = auth.uid() (или admin)
  const { data: inserted, error } = await supabase
    .from('projects')
    .insert({
      project_key,
      name,
      owner_id: userId,
    })
    .select('id, project_key, name, status, owner_id, created_at')
    .single();

  if (error) throw new Error(error.message);

  // По ТЗ связь проекта с пользователем: добавляем owner в project_members
  const { error: memberErr } = await supabase.from('project_members').insert({
    project_id: inserted.id,
    user_id: userId,
    role_in_project: 'owner',
  });

  if (memberErr) throw new Error(memberErr.message);

  return inserted as ProjectRow;
}

export async function updateProject(projectId: string, patch: { name?: string }): Promise<ProjectRow> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  const updatePayload: any = {};
  if (typeof patch.name === 'string') updatePayload.name = patch.name.trim();

  const { data, error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId)
    .select('id, project_key, name, status, owner_id, created_at')
    .single();

  if (error) throw new Error(error.message);
  return data as ProjectRow;
}

export async function archiveProject(projectId: string): Promise<ProjectRow> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  const { data, error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', projectId)
    .select('id, project_key, name, status, owner_id, created_at')
    .single();

  if (error) throw new Error(error.message);
  return data as ProjectRow;
}

export type ProjectMemberRow = {
  project_id: string;
  user_id: string;
  role_in_project: 'owner' | 'member';
  created_at: string;
};

export async function listProjectMembers(projectId: string): Promise<ProjectMemberRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  const { data, error } = await supabase
    .from('project_members')
    .select('project_id, user_id, role_in_project, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectMemberRow[];
}

export async function addProjectMember(input: {
  project_id: string;
  user_id: string;
  role_in_project: 'member' | 'owner';
}): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  const { error } = await supabase.from('project_members').insert({
    project_id: input.project_id,
    user_id: input.user_id,
    role_in_project: input.role_in_project,
  });

  if (error) throw new Error(error.message);
}

export async function removeProjectMember(input: { project_id: string; user_id: string }): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  mustAuthUserId(authData.user?.id);

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', input.project_id)
    .eq('user_id', input.user_id);

  if (error) throw new Error(error.message);
}
