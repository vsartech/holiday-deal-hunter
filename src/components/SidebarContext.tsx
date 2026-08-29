'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed, mounted]);

  const toggle = () => setCollapsed(c => !c);

  if (!mounted) {
    return (
      <SidebarContext.Provider value={{ collapsed: false, toggle: () => {} }}>
        {children}
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}