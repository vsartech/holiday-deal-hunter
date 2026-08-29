'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from './SidebarContext';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/deals', label: 'Travel Deals', icon: '💰' },
  { href: '/offers', label: 'Card Offers', icon: '💳' },
  { href: '/market', label: 'Market Intel', icon: '📈' },
  { href: '/competitors', label: 'Competitors', icon: '🏢' },
  { href: '/chat', label: 'AI Assistant', icon: '🤖' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 bg-gray-900 text-white flex flex-col z-40 transition-all duration-300 ease-in-out"
      style={{ width: sidebarWidth }}
    >
      {/* Brand / Toggle */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              HI
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">Holiday</div>
              <div className="text-xs text-gray-400 leading-tight truncate">Intelligence</div>
            </div>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '⟶' : '⟵'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {!collapsed && (
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
            Navigation
          </div>
        )}
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800">
        {!collapsed && (
          <div className="text-[10px] text-gray-500 text-center">
            Holiday Intelligence v1.0
          </div>
        )}
        {collapsed && (
          <div className="text-[9px] text-gray-500 text-center leading-tight">
            HI v1.0
          </div>
        )}
      </div>
    </aside>
  );
}