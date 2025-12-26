'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Application error</h1>

      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {String(error?.message ?? 'Unknown error')}
      </div>

      {error?.digest && (
        <div style={{ fontFamily: 'monospace', opacity: 0.8 }}>
          Digest: {error.digest}
        </div>
      )}

      <button onClick={() => reset()}>Retry</button>
    </main>
  );
}
