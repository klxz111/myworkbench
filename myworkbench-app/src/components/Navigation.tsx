'use client';

import Link from 'next/link';

const navItems = [
  { href: '/', label: 'HOME' },
  { href: '/strategy', label: 'STRATEGY' },
  { href: '/decisions', label: 'DECISIONS' },
  { href: '/research', label: 'RESEARCH' },
  { href: '/evidence', label: 'EVIDENCE' },
  { href: '/belief', label: 'BELIEF' },
  { href: '/projects', label: 'PROJECTS' },
  { href: '/people', label: 'PEOPLE' },
  { href: '/graph', label: 'GRAPH' },
];

export function Navigation() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              myworkbench
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
