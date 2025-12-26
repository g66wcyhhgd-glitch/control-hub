import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Project not found</h1>
      <Link href="/projects">Back to projects</Link>
    </main>
  );
}
