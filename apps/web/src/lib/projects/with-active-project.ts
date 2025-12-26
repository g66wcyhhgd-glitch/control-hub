// apps/web/src/lib/projects/with-active-project.ts
import 'server-only';

import { requireActiveProjectId } from './require-active-project';

export async function withActiveProject<T>(
  fn: (projectId: string) => Promise<T>
): Promise<T> {
  const projectId = await requireActiveProjectId();
  return await fn(projectId);
}
