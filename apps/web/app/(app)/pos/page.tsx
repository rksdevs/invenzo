'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency } from '../../../lib/format';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Product { id: string; name: string; hsnSac: string; sellingPrice: number; gstRate: number; unit: string; }
interface Customer { id: string; name: string; phone?: string; }
interface Sale { id: string; invoiceNumber: string; totalAmount: number; createdAt: string; }

export default function PosPage() {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [productId, setProductId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [qty, setQty] = useState(1);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('UPI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(() => products.find((item) => item.id === productId), [products, productId]);
  const taxable = (selectedProduct?.sellingPrice ?? 0) * qty;
  const tax = taxable * ((selectedProduct?.gstRate ?? 0) / 100);
  const total = taxable + tax;

  const load = async () => {
    if (!session) return;
    const [productsData, customersData, salesData] = await Promise.all([
      apiFetch<Product[]>('/products', {}, session.accessToken),
      apiFetch<Customer[]>('/customers', {}, session.accessToken),
      apiFetch<Sale[]>('/sales', {}, session.accessToken),
    ]);
    setProducts(productsData);
    setCustomers(customersData);
    setSales(salesData);
    if (productsData[0]) setProductId(productsData[0].id);
    if (customersData[0]) setCustomerId(customersData[0].id);
  };

  useEffect(() => { load().catch(() => undefined); }, [session]);

  const createSale = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !selectedProduct) return;
    setLoading(true);
    setError(null);
    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerId: customerId || undefined,
          invoiceNumber,
          items: [
            {
              productId: selectedProduct.id,
              description: selectedProduct.name,
              hsnSac: selectedProduct.hsnSac,
              quantity: qty,
              rate: selectedProduct.sellingPrice,
              gstRate: selectedProduct.gstRate,
            },
          ],
          payments: [
            {
              mode: paymentMode,
              amount: total,
              reference: paymentMode === 'UPI' ? `UPI-${Date.now()}` : undefined,
            },
          ],
          isCredit: paymentMode === 'CREDIT',
        }),
      }, session.accessToken);
      await load();
      setQty(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader><CardTitle>Create Customer Bill</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={createSale}>
            <div><Label>Product</Label><select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></div>
            <div><Label>Customer</Label><select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Walk-in</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Quantity</Label><Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 1))} /></div>
              <div><Label>Payment</Label><select className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'CASH' | 'UPI' | 'CARD' | 'CREDIT')}><option>CASH</option><option>UPI</option><option>CARD</option><option>CREDIT</option></select></div>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>Rate: {formatCurrency(selectedProduct?.sellingPrice ?? 0)}</p>
              <p>GST: {selectedProduct?.gstRate ?? 0}%</p>
              <p className="font-semibold">Bill Total: {formatCurrency(total)}</p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={loading}>{loading ? 'Creating bill...' : 'Generate Bill & Update Stock'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Bills</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {sales.slice(0, 8).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.invoiceNumber}</TableCell>
                  <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" asChild><Link href={`/invoices/print?id=${sale.id}`}>Print</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
