'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';

interface StockRow { productId: string; productName: string; currentQty: number; unit: string; lowStock: boolean; }
interface Product { id: string; name: string; }

export default function InventoryPage() {
  const { session } = useAuth();
  const [stock, setStock] = useState<StockRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustment, setAdjustment] = useState({ productId: '', quantity: 0, reason: '' });

  const load = async () => {
    if (!session) return;
    const [stockData, productData] = await Promise.all([
      apiFetch<StockRow[]>('/inventory/stock', {}, session.accessToken),
      apiFetch<Product[]>('/products', {}, session.accessToken),
    ]);
    setStock(stockData);
    setProducts(productData);
    setAdjustment((prev) => ({ ...prev, productId: prev.productId || productData[0]?.id || '' }));
  };

  useEffect(() => { load().catch(() => undefined); }, [session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    await apiFetch('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    }, session.accessToken);
    setAdjustment({ ...adjustment, quantity: 0, reason: '' });
    await load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Manual Inventory Register Entry</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
            <div><Label>Product</Label><select className="h-10 w-full rounded-md border border-border bg-white px-3" value={adjustment.productId} onChange={(e) => setAdjustment({ ...adjustment, productId: e.target.value })}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
            <div><Label>Quantity (+/-)</Label><Input type="number" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: Number(e.target.value || 0) })} /></div>
            <div className="md:col-span-2"><Label>Reason</Label><Input value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} /></div>
            <div className="md:col-span-4"><Button>Post Adjustment</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Stock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Available</TableHead><TableHead>Unit</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {stock.map((row) => (
                <TableRow key={row.productId}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.currentQty}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.lowStock ? <Badge className="bg-red-100 text-red-700">Low</Badge> : <Badge className="bg-green-100 text-green-700">OK</Badge>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
