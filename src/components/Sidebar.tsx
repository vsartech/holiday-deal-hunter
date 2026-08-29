'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-gray-900 text-white flex flex-col z-40">
      {/* Brand */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            HI
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Holiday</div>
            <div className="text-xs text-gray-400 leading-tight">Intelligence</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
          Navigation
        </div>
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
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-[10px] text-gray-500 text-center">
          Holiday Intelligence v1.0
        </div>
      </div>
    </aside>
  );
}
