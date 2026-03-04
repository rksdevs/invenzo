'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface StockRow { productId: string; productName: string; currentQty: number; lowStock: boolean; unit: string; }
interface SaleRow { id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number; }
interface PurchaseRow { id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number; supplier: { name: string } }

export default function DashboardPage() {
  const { session } = useAuth();
  const [stock, setStock] = useState<StockRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [gst, setGst] = useState<{ sales?: { totalTaxAmount?: number }; purchases?: { totalTaxAmount?: number } }>({});

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch<StockRow[]>('/inventory/stock', {}, session.accessToken),
      apiFetch<SaleRow[]>('/reports/sales-register', {}, session.accessToken),
      apiFetch<PurchaseRow[]>('/reports/purchase-register', {}, session.accessToken),
      apiFetch<{ sales: { totalTaxAmount: number }; purchases: { totalTaxAmount: number } }>('/reports/gst-summary', {}, session.accessToken),
    ]).then(([stockData, salesData, purchaseData, gstData]) => {
      setStock(stockData);
      setSales(salesData);
      setPurchases(purchaseData);
      setGst(gstData);
    });
  }, [session]);

  const todaySales = sales.reduce((sum, sale) => sum + Number((sale as unknown as { totalAmount: string | number }).totalAmount), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Sales Register Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(todaySales)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Purchase Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(purchases.reduce((sum, row) => sum + Number((row as unknown as { totalAmount: string | number }).totalAmount), 0))}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Output GST</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(gst.sales?.totalTaxAmount)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Input GST</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrency(gst.purchases?.totalTaxAmount)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stock.filter((row) => row.lowStock).length === 0 ? <p className="text-sm text-muted-foreground">No low stock items.</p> : null}
            {stock.filter((row) => row.lowStock).map((row) => (
              <div key={row.productId} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span>{row.productName}</span>
                <Badge>{row.currentQty} {row.unit}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {sales.slice(0, 5).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.invoiceNumber}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(row.invoiceDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
