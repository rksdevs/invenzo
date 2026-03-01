'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency } from '../../../lib/format';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Product { id: string; name: string; hsnSac: string; unit: string; gstRate: number; sellingPrice: number; lowStockThreshold: number; }

export default function ProductsPage() {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', hsnSac: '', unit: 'PCS', gstRate: 12, sellingPrice: 0, lowStockThreshold: 0 });

  const load = async () => {
    if (!session) return;
    const data = await apiFetch<Product[]>('/products', {}, session.accessToken);
    setProducts(data);
  };

  useEffect(() => { load().catch(() => undefined); }, [session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    await apiFetch('/products', { method: 'POST', body: JSON.stringify(form) }, session.accessToken);
    setForm({ name: '', hsnSac: '', unit: 'PCS', gstRate: 12, sellingPrice: 0, lowStockThreshold: 0 });
    await load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add Product</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>HSN/SAC</Label><Input value={form.hsnSac} onChange={(e) => setForm({ ...form, hsnSac: e.target.value })} /></div>
            <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div><Label>GST %</Label><Input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value || 0) })} /></div>
            <div><Label>Selling Price</Label><Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value || 0) })} /></div>
            <div><Label>Low Stock Threshold</Label><Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value || 0) })} /></div>
            <div className="md:col-span-3"><Button>Add Product</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>HSN</TableHead><TableHead>GST</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.hsnSac}</TableCell>
                  <TableCell>{product.gstRate}%</TableCell>
                  <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
