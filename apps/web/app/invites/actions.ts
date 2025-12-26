// apps/web/app/invites/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveProjectId, setActiveProjectId } from '@/lib/projects/active-project';
import { requireActiveProjectId } from '@/lib/projects/require-active-project';
import { acceptInvite, createInvite, setInviteStatus } from '@/lib/data/invites';

function normalizeRole(v: unknown): 'owner' | 'member' {
  const s = String(v ?? '').trim();
  return s === 'owner' ? 'owner' : 'member';
}

export async function createInviteAction(formData: FormData) {
  const projectId = await requireActiveProjectId();

  const email = String(formData.get('email') ?? '').trim();
  const role = normalizeRole(formData.get('role'));

  await createInvite({ projectId, email, role });

  revalidatePath('/invites');
}

export async function expireInviteAction(formData: FormData) {
  const inviteId = String(formData.get('inviteId') ?? '').trim();
  if (!inviteId) throw new Error('inviteId is required');

  await setInviteStatus({ inviteId, status: 'expired' });

  revalidatePath('/invites');
}

export async function acceptInviteAction(formData: FormData) {
  const inviteId = String(formData.get('inviteId') ?? '').trim();
  if (!inviteId) throw new Error('inviteId is required');

  const projectId = await acceptInvite({ inviteId });

  // set active project after acceptance
  await setActiveProjectId(projectId);

  revalidatePath('/projects');
  revalidatePath('/team');
  revalidatePath('/invites');

  redirect('/team');
}

export async function goToActiveProjectInvitesAction() {
  const active = await getActiveProjectId();
  if (!active) redirect('/projects?need_project=1&next=/invites');
  redirect('/invites');
}
