'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['Dashboard', '/dashboard'],
  ['POS', '/pos'],
  ['Purchases', '/purchases'],
  ['Inventory', '/inventory'],
  ['Products', '/products'],
  ['Suppliers', '/suppliers'],
  ['Customers', '/customers'],
  ['Reports', '/reports'],
  ['Settings', '/settings'],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">Invenzo</div>
        {links.map(([label, href]) => (
          <Link key={href} href={href} className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}>
            {label}
          </Link>
        ))}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
