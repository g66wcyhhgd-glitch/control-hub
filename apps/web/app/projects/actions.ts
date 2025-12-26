'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { archiveProject, createProject, updateProject } from '@/lib/data/projects';
import { clearActiveProjectId, setActiveProjectId } from '@/lib/projects/active-project';

export async function createProjectAction(formData: FormData) {
  const project_key = String(formData.get('project_key') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();

  const created = await createProject({ project_key, name });

  // после создания — делаем активным
  await setActiveProjectId(created.id);

  revalidatePath('/projects');
  redirect(`/projects/${created.id}`);
}

export async function openProjectAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '').trim();
  if (!projectId) throw new Error('projectId is required');

  await setActiveProjectId(projectId);

  revalidatePath('/projects');
  redirect(`/projects/${projectId}`);
}

export async function renameProjectAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();

  if (!projectId) throw new Error('projectId is required');

  await updateProject(projectId, { name });

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
}

export async function archiveProjectAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '').trim();
  if (!projectId) throw new Error('projectId is required');

  await archiveProject(projectId);

  // если текущий активный архивировали — сбрасываем
  await clearActiveProjectId();

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  redirect('/projects');
}

/** Для Topbar select */
export async function setActiveProjectAction(formData: FormData) {
  const projectId = String(formData.get('projectId') ?? '').trim();
  if (!projectId) throw new Error('projectId is required');

  await setActiveProjectId(projectId);

  revalidatePath('/projects');
}

export async function clearActiveProjectAction() {
  await clearActiveProjectId();
  revalidatePath('/projects');
}
