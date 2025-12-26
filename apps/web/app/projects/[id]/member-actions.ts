'use server';

import { revalidatePath } from 'next/cache';

import { addProjectMember, removeProjectMember } from '@/lib/data/projects';

function normalizeRole(roleRaw: unknown): 'owner' | 'member' {
  const role = String(roleRaw ?? '').trim();
  return role === 'owner' ? 'owner' : 'member';
}

export async function addMemberAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '').trim();
  const userId = String(formData.get('userId') ?? '').trim();
  const role = normalizeRole(formData.get('role'));

  if (!projectId) throw new Error('projectId is required');
  if (!userId) throw new Error('userId is required');

  await addProjectMember({
    project_id: projectId,
    user_id: userId,
    role_in_project: role,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/audit`);
}

export async function removeMemberAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '').trim();
  const userId = String(formData.get('userId') ?? '').trim();

  if (!projectId) throw new Error('projectId is required');
  if (!userId) throw new Error('userId is required');

  await removeProjectMember({
    project_id: projectId,
    user_id: userId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/audit`);
}
