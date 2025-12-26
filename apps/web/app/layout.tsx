export const metadata = {
  title: "CONTROL HUB",
  description: "CONTROL HUB staging"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
