'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency } from '../../../lib/format';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Product { id: string; name: string; hsnSac: string; unit: string; gstRate: number; sellingPrice: number; lowStockThreshold: number; }
interface OcrItem {
  slNo?: string;
  description?: string;
  name?: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  per?: string;
  amount?: number;
  gstRate?: number;
  unit?: string;
  barcode?: string;
}
interface OcrParseResponse {
  sourceFileName: string;
  rawText: string;
  warnings: string[];
  draft: {
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: OcrItem[];
  };
}

export default function ProductsPage() {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', hsnSac: '', unit: 'PCS', gstRate: 12, sellingPrice: 0, lowStockThreshold: 0 });
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [ocrDraft, setOcrDraft] = useState({
    supplierName: '',
    invoiceNumber: '',
    invoiceDate: '',
    items: [] as OcrItem[],
  });

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

  const ocrTotal = useMemo(() => ocrDraft.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0), [ocrDraft.items]);

  const parseInvoice = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !ocrFile) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrSuccess(null);
    setOcrWarnings([]);

    try {
      const body = new FormData();
      body.append('file', ocrFile);
      const response = await apiFetch<OcrParseResponse>('/ocr/invoices/parse', { method: 'POST', body }, session.accessToken);
      setOcrDraft({
        supplierName: response.draft.supplierName,
        invoiceNumber: response.draft.invoiceNumber,
        invoiceDate: response.draft.invoiceDate,
        items: response.draft.items,
      });
      setOcrWarnings(response.warnings ?? []);
    } catch (err) {
      setOcrError((err as Error).message);
    } finally {
      setOcrLoading(false);
    }
  };

  const confirmOcrImport = async () => {
    if (!session) return;
    setImportLoading(true);
    setOcrError(null);
    setOcrSuccess(null);
    try {
      const response = await apiFetch<{ success: boolean; invoiceId: string; itemsImported: number }>('/ocr/invoices/confirm', {
        method: 'POST',
        body: JSON.stringify({
          supplierName: ocrDraft.supplierName,
          invoiceNumber: ocrDraft.invoiceNumber,
          invoiceDate: ocrDraft.invoiceDate,
          items: ocrDraft.items.map((item) => ({
            ...item,
            name: item.name || item.description || '',
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
            gstRate: Number(item.gstRate || 12),
            amount: Number(item.amount || Number(item.quantity || 0) * Number(item.rate || 0)),
          })),
        }),
      }, session.accessToken);
      setOcrSuccess(`Imported ${response.itemsImported} items successfully.`);
      await load();
      setOcrFile(null);
    } catch (err) {
      setOcrError((err as Error).message);
    } finally {
      setImportLoading(false);
    }
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
        <CardHeader><CardTitle>Import Products via Invoice OCR</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={parseInvoice}>
            <div>
              <Label>Invoice Image / PDF</Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setOcrFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button disabled={!ocrFile || ocrLoading}>{ocrLoading ? 'Scanning invoice...' : 'Scan Invoice'}</Button>
          </form>

          {ocrWarnings.length > 0 ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {ocrWarnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          ) : null}
          {ocrError ? <p className="text-sm text-red-600">{ocrError}</p> : null}
          {ocrSuccess ? <p className="text-sm text-green-700">{ocrSuccess}</p> : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Supplier</Label><Input value={ocrDraft.supplierName} onChange={(e) => setOcrDraft({ ...ocrDraft, supplierName: e.target.value })} /></div>
            <div><Label>Invoice Number</Label><Input value={ocrDraft.invoiceNumber} onChange={(e) => setOcrDraft({ ...ocrDraft, invoiceNumber: e.target.value })} /></div>
            <div><Label>Invoice Date</Label><Input type="date" value={ocrDraft.invoiceDate} onChange={(e) => setOcrDraft({ ...ocrDraft, invoiceDate: e.target.value })} /></div>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead className="hidden sm:table-cell">SlNo</TableHead><TableHead>Description</TableHead><TableHead className="hidden sm:table-cell">HSN/SAC</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead className="hidden sm:table-cell">Per</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {ocrDraft.items.map((item, index) => {
                const computedAmount = Number(item.quantity || 0) * Number(item.rate || 0);
                return (
                <TableRow key={`${item.description || item.name || 'row'}-${index}`}>
                  <TableCell className="hidden sm:table-cell"><Input value={item.slNo || String(index + 1)} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, slNo: e.target.value } : row) }))} /></TableCell>
                  <TableCell><Input value={item.description || item.name || ''} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, description: e.target.value, name: e.target.value } : row) }))} /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Input value={item.hsnSac || ''} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, hsnSac: e.target.value } : row) }))} /></TableCell>
                  <TableCell><Input type="number" value={item.quantity} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value || 0) } : row) }))} /></TableCell>
                  <TableCell><Input type="number" value={item.rate} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, rate: Number(e.target.value || 0) } : row) }))} /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Input value={item.per || item.unit || 'PCS'} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, per: e.target.value, unit: e.target.value } : row) }))} /></TableCell>
                  <TableCell><Input type="number" value={item.amount ?? computedAmount} onChange={(e) => setOcrDraft((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, amount: Number(e.target.value || 0) } : row) }))} /></TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">Approx taxable total: {ocrTotal.toFixed(2)}</p>
          <Button disabled={importLoading || ocrDraft.items.length === 0} onClick={confirmOcrImport}>
            {importLoading ? 'Importing...' : 'Confirm Import + Update Stock'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">HSN</TableHead><TableHead>GST</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{product.hsnSac}</TableCell>
                  <TableCell>{product.gstRate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.sellingPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
