'use client';

import { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main style={{ maxWidth: 520, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Login</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          type="email"
          required
        />
        <button type="submit" disabled={sent}>
          {sent ? 'Link sent' : 'Send magic link'}
        </button>
      </form>

      {sent && (
        <div style={{ fontSize: 14 }}>
          Check your email and open the magic link.
        </div>
      )}

      {error && <div style={{ color: 'crimson' }}>{error}</div>}
    </main>
  );
}
