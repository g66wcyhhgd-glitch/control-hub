import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  const envOk = !!supabaseUrl && !!supabaseAnonKey;

  let userId: string | null = null;
  let authError: string | null = null;

  if (envOk) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) authError = error.message;
      userId = data.user?.id ?? null;
    } catch (e: any) {
      authError = String(e?.message ?? e);
    }
  }

  return NextResponse.json({
    envOk,
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    userId,
    authError,
  });
}
