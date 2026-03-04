'use client';

import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center p-4 sm:p-6">
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/90">
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Multi Tenant GST POS</p>
            <CardTitle className="text-3xl sm:text-4xl">Built for Bicycle & Spare Part Retail in India</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Fast counter billing, purchase register, inventory movement ledger, GST reports, and A4 tax invoice print flow.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild><Link href="/signup">Start Free</Link></Button>
              <Button variant="outline" asChild><Link href="/login">Login</Link></Button>
              <Button variant="ghost" asChild><Link href="/pricing">Pricing</Link></Button>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-100 to-orange-50">
          <CardHeader>
            <CardTitle className="text-2xl">Included in MVP</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p>1. Multi-tenant owner and staff login</p>
            <p>2. Purchase invoice entry from wholesalers</p>
            <p>3. Inventory auto-update via stock movements</p>
            <p>4. POS billing with tax split and payments</p>
            <p>5. Reports: sales, purchase, GST, stock valuation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
