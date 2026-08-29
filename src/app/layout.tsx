import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Holiday Intelligence Platform',
  description: 'AI-powered travel deal finder with market intelligence and competitor analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[240px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
