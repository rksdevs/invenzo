'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, ReceiptText, ShoppingCart, Package, Boxes, Users, Truck, ChartNoAxesCombined, Settings, LogOut, Menu, X, ScanLine } from 'lucide-react';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/purchases', label: 'Purchases', icon: ReceiptText },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/onboarding', label: 'Onboarding', icon: ScanLine },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, me, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen overflow-x-clip lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-b border-border/80 bg-card/90 backdrop-blur lg:block lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-6">
          <div className="min-w-0">
            <p className="text-xl font-black tracking-tight">Invenzo</p>
            <p className="truncate text-xs text-muted-foreground">{me?.tenant?.businessName ?? 'Store'}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.replace('/login'); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <nav className="grid grid-cols-1 gap-2 p-6 pt-0">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition', pathname.startsWith(link.href) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 hover:bg-muted')}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:hidden">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0 pr-2">
              <p className="text-lg font-black tracking-tight">Invenzo</p>
              <p className="truncate text-xs text-muted-foreground">{me?.tenant?.businessName ?? 'Store'}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <div
          className={cn(
            'fixed inset-0 z-40 transition-opacity duration-200',
            mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          )}
          aria-hidden={!mobileOpen}
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              'relative h-full w-[82vw] max-w-[320px] border-r border-border/80 bg-card p-4 shadow-2xl transition-transform duration-200',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-lg font-black tracking-tight">Invenzo</p>
                <p className="truncate text-xs text-muted-foreground">{me?.tenant?.businessName ?? 'Store'}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="grid gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition', pathname.startsWith(link.href) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 hover:bg-muted')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full justify-start"
              onClick={() => { logout(); router.replace('/login'); }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </aside>
        </div>
      </div>

      <main className="min-w-0 p-4 lg:p-6">{children}</main>
    </div>
  );
}
