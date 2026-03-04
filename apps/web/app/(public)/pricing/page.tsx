'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-semibold sm:text-3xl">Pricing</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Starter</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Single store operations, core billing and inventory.</p>
            <p className="mt-4 text-xl font-semibold">Contact sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Growth</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Advanced reports, user management, and automation extensions.</p>
            <p className="mt-4 text-xl font-semibold">Contact sales</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
