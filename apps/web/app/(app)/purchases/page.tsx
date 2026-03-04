'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/format';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; hsnSac: string; gstRate: number }
interface Purchase { id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number; supplier: { name: string } }

export default function PurchasesPage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [form, setForm] = useState({ supplierId: '', invoiceNumber: '', invoiceDate: '', productId: '', quantity: 1, rate: 0, gstRate: 12 });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session) return;
    const [supplierData, productData, purchaseData] = await Promise.all([
      apiFetch<Supplier[]>('/suppliers', {}, session.accessToken),
      apiFetch<Product[]>('/products', {}, session.accessToken),
      apiFetch<Purchase[]>('/purchases', {}, session.accessToken),
    ]);
    setSuppliers(supplierData);
    setProducts(productData);
    setPurchases(purchaseData);
    setForm((prev) => ({
      ...prev,
      supplierId: prev.supplierId || supplierData[0]?.id || '',
      productId: prev.productId || productData[0]?.id || '',
      rate: prev.rate || Number((productData[0] as unknown as { sellingPrice?: number })?.sellingPrice ?? 0),
    }));
  };

  useEffect(() => { load().catch(() => undefined); }, [session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setError(null);
    const product = products.find((item) => item.id === form.productId);
    if (!product) return;

    try {
      await apiFetch('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: form.supplierId,
          invoiceNumber: form.invoiceNumber,
          invoiceDate: form.invoiceDate,
          items: [
            {
              productId: product.id,
              description: product.name,
              hsnSac: product.hsnSac,
              quantity: form.quantity,
              rate: form.rate,
              gstRate: form.gstRate,
            },
          ],
        }),
      }, session.accessToken);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Manual Purchase Invoice Entry (Wholesale Bill)</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
            <div><Label>Supplier</Label><select className="h-10 w-full rounded-md border border-border bg-card px-3" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></div>
            <div><Label>Invoice Number</Label><Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
            <div><Label>Invoice Date</Label><Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} /></div>
            <div><Label>Product</Label><select className="h-10 w-full rounded-md border border-border bg-card px-3" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></div>
            <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value || 1) })} /></div>
            <div><Label>Rate</Label><Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value || 0) })} /></div>
            <div><Label>GST Rate</Label><Input type="number" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value || 0) })} /></div>
            <div className="md:col-span-3"><Button>Save Purchase Invoice</Button></div>
          </form>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Purchase Register</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Supplier</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {purchases.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.invoiceNumber}</TableCell>
                  <TableCell>{row.supplier.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(row.invoiceDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
