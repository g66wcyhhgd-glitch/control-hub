// apps/web/src/lib/data/audit.ts
import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AuditEventRow = {
  id: string;
  project_id: string | null;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

async function getUserIdOrNull(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function listAuditEvents(projectId: string, limit = 50): Promise<AuditEventRow[]> {
  const userId = await getUserIdOrNull();
  if (!userId) return [];

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('audit_events')
    .select('id, project_id, event_type, actor_id, payload, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AuditEventRow[];
}
