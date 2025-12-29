// apps/web/app/api/webhooks/[provider]/route.ts
import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type WebhookBody = {
  project_key: string;
  event_type: string;
  event_id: string;
  timestamp: string | number;
  payload: unknown;
};

function normalizeSignature(sig: string) {
  const s = sig.trim();
  return s.startsWith('sha256=') ? s.slice('sha256='.length) : s;
}

function timingSafeEqualHex(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function audit(
  event_type: string,
  project_id: string | null,
  payload: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();
  await supabase.from('audit_events').insert({
    project_id,
    event_type,
    actor_id: null,
    payload,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider;

  // raw body нужен для signature проверки
  const raw = await request.text();

  let body: WebhookBody | null = null;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    await audit('webhook_rejected', null, { provider, reason: 'invalid_json' });
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const project_key = body?.project_key;
  const event_type = body?.event_type;
  const event_id = body?.event_id;
  const timestamp = body?.timestamp;
  const payload = body?.payload;

  if (
    !project_key ||
    !event_type ||
    !event_id ||
    typeof payload === 'undefined' ||
    typeof timestamp === 'undefined'
  ) {
    await audit('webhook_rejected', null, { provider, reason: 'missing_fields' });
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const requestSecret =
    request.headers.get('x-control-hub-secret') ??
    request.headers.get('x-webhook-secret');

  if (!requestSecret) {
    await audit('webhook_rejected', null, {
      provider,
      project_key,
      event_type,
      event_id,
      reason: 'missing_secret',
    });
    return NextResponse.json({ ok: false, error: 'missing_secret' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // 1) project by project_key
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('project_key', project_key)
    .maybeSingle();

  if (projectError || !project?.id) {
    await audit('webhook_rejected', null, {
      provider,
      project_key,
      event_type,
      event_id,
      reason: 'project_not_found',
    });
    return NextResponse.json({ ok: false, error: 'project_not_found' }, { status: 404 });
  }

  const projectId = project.id as string;

  // 2) integration by (project_id, provider)
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id, secret, status')
    .eq('project_id', projectId)
    .eq('provider', provider)
    .maybeSingle();

  if (integrationError || !integration?.id) {
    await audit('webhook_rejected', projectId, {
      provider,
      event_type,
      event_id,
      reason: 'integration_not_found',
    });
    return NextResponse.json({ ok: false, error: 'integration_not_found' }, { status: 404 });
  }

  if ((integration.status as string) !== 'active') {
    await audit('webhook_rejected', projectId, {
      provider,
      event_type,
      event_id,
      reason: 'integration_inactive',
    });
    return NextResponse.json({ ok: false, error: 'integration_inactive' }, { status: 403 });
  }

  const integrationSecret = integration.secret as string;

  // 3) secret check
  if (requestSecret !== integrationSecret) {
    await audit('webhook_rejected', projectId, {
      provider,
      event_type,
      event_id,
      reason: 'invalid_secret',
    });
    return NextResponse.json({ ok: false, error: 'invalid_secret' }, { status: 401 });
  }

  // 4) optional signature check (HMAC SHA256 over RAW BODY)
  const sigHeader = request.headers.get('x-control-hub-signature');
  if (sigHeader) {
    const got = normalizeSignature(sigHeader);
    const expected = crypto
      .createHmac('sha256', integrationSecret)
      .update(raw, 'utf8')
      .digest('hex');

    if (!timingSafeEqualHex(got, expected)) {
      await audit('webhook_rejected', projectId, {
        provider,
        event_type,
        event_id,
        reason: 'invalid_signature',
      });
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    }
  }

  // 5) save raw payload
  const { error: insertError } = await supabase.from('incoming_events').insert({
    project_id: projectId,
    provider,
    event_type,
    external_event_id: event_id,
    payload: payload as any,
  });

  if (insertError) {
    await audit('webhook_rejected', projectId, {
      provider,
      event_type,
      event_id,
      reason: 'db_insert_failed',
    });
    return NextResponse.json({ ok: false, error: 'db_insert_failed' }, { status: 500 });
  }

  // 6) audit
  await audit('webhook_received', projectId, {
    provider,
    event_type,
    event_id,
    timestamp,
  });

  return NextResponse.json({ ok: true });
}
