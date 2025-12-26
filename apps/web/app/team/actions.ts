// apps/web/app/team/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

import { requireActiveProjectId } from '@/lib/projects/require-active-project';
import { changeMemberRole, removeMember } from '@/lib/data/team';

function normalizeRole(v: unknown): 'owner' | 'member' {
  const s = String(v ?? '').trim();
  return s === 'owner' ? 'owner' : 'member';
}

export async function changeRoleAction(formData: FormData) {
  const projectId = await requireActiveProjectId();
  const userId = String(formData.get('userId') ?? '').trim();
  const role = normalizeRole(formData.get('role'));

  if (!userId) throw new Error('userId is required');

  await changeMemberRole({ projectId, userId, role });

  revalidatePath('/team');
}

export async function removeMemberAction(formData: FormData) {
  const projectId = await requireActiveProjectId();
  const userId = String(formData.get('userId') ?? '').trim();

  if (!userId) throw new Error('userId is required');

  await removeMember({ projectId, userId });

  revalidatePath('/team');
}
