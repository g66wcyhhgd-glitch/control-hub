import { NextResponse } from 'next/server';
import { requireActiveProjectId } from '@/lib/projects/require-active-project';

export async function GET() {
  const projectId = await requireActiveProjectId();
  return NextResponse.json({ ok: true, activeProjectId: projectId });
}
