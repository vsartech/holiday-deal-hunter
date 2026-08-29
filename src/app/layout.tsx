import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Holiday Deal Hunter - Find Cheapest Travel Deals',
  description: 'AI-powered travel deal finder with card offer matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
