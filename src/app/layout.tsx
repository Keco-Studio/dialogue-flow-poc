import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Narrative Flow Editor',
  description: 'A visual dialogue and narrative flow editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
