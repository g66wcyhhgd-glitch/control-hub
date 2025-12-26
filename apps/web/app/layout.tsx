import type { ReactNode } from 'react';
import Topbar from './_components/Topbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Topbar />
        <div style={{ padding: 24 }}>{children}</div>
      </body>
    </html>
  );
}
