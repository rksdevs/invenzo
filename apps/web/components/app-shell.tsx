'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, ReceiptText, ShoppingCart, Package, Boxes, Users, Truck, ChartNoAxesCombined, Settings, LogOut } from 'lucide-react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/purchases', label: 'Purchases', icon: ReceiptText },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, me, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border/70 bg-white/85 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <div>
            <p className="text-xl font-black tracking-tight">Invenzo</p>
            <p className="text-xs text-muted-foreground">{me?.tenant?.businessName ?? 'Store'}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.replace('/login'); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <nav className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-1 lg:p-6">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                  pathname.startsWith(link.href) ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="p-4 lg:p-6">{children}</main>
    </div>
  );
}
