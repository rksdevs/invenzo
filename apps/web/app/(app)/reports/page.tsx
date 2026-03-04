'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

export default function ReportsPage() {
  const { session } = useAuth();
  const [sales, setSales] = useState<Array<{ id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number }>>([]);
  const [purchases, setPurchases] = useState<Array<{ id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number }>>([]);
  const [gst, setGst] = useState<{ sales: { totalTaxAmount?: number }; purchases: { totalTaxAmount?: number } } | null>(null);
  const [stockValuation, setStockValuation] = useState<{ totalValuation: number; rows: Array<{ productName: string; quantity: number; valuation: number }> } | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch<Array<{ id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number }>>('/reports/sales-register', {}, session.accessToken),
      apiFetch<Array<{ id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number }>>('/reports/purchase-register', {}, session.accessToken),
      apiFetch<{ sales: { totalTaxAmount?: number }; purchases: { totalTaxAmount?: number } }>('/reports/gst-summary', {}, session.accessToken),
      apiFetch<{ totalValuation: number; rows: Array<{ productName: string; quantity: number; valuation: number }> }>('/reports/stock-valuation', {}, session.accessToken),
    ]).then(([salesData, purchaseData, gstData, stockData]) => {
      setSales(salesData);
      setPurchases(purchaseData);
      setGst(gstData);
      setStockValuation(stockData);
    });
  }, [session]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Reports</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Output GST</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(gst?.sales?.totalTaxAmount)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Input GST</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(gst?.purchases?.totalTaxAmount)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Stock Valuation</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(stockValuation?.totalValuation)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sales Register</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{sales.map((row) => <TableRow key={row.id}><TableCell>{row.invoiceNumber}</TableCell><TableCell className="hidden sm:table-cell">{formatDate(row.invoiceDate)}</TableCell><TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell></TableRow>)}</TableBody></Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Purchase Register</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{purchases.map((row) => <TableRow key={row.id}><TableCell>{row.invoiceNumber}</TableCell><TableCell className="hidden sm:table-cell">{formatDate(row.invoiceDate)}</TableCell><TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell></TableRow>)}</TableBody></Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
