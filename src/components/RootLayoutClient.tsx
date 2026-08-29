'use client';

import { useSidebar } from '@/components/SidebarContext';
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider } from '@/components/SidebarContext';

interface MainContentProps {
  children: ReactNode;
}

function MainContent({ children }: MainContentProps) {
  const { collapsed } = useSidebar();
  const marginLeft = collapsed ? 64 : 240;

  return (
    <main 
      className="flex-1 min-h-screen transition-all duration-300 ease-in-out bg-gray-50"
      style={{ marginLeft }}
    >
      {children}
    </main>
  );
}

function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}