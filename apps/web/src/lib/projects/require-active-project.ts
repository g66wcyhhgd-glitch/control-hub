// apps/web/src/lib/projects/require-active-project.ts
import 'server-only';

import { getActiveProjectId } from './active-project';

export async function requireActiveProjectId(): Promise<string> {
  const projectId = await getActiveProjectId();
  if (!projectId) throw new Error('ACTIVE_PROJECT_REQUIRED');
  return projectId;
}
