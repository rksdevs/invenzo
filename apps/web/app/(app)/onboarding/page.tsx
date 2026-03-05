'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface DraftItem {
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

interface ParseResponse {
  sourceFileName: string;
  rawText: string;
  warnings: string[];
  draft: {
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: DraftItem[];
  };
}

export default function OnboardingPage() {
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loadingParse, setLoadingParse] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [form, setForm] = useState({
    supplierName: '',
    invoiceNumber: '',
    invoiceDate: '',
    items: [] as DraftItem[],
  });

  const totalPreview = useMemo(() => form.items.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.rate || 0), 0), [form.items]);

  const parseFile = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !file) return;
    setLoadingParse(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);

    try {
      const body = new FormData();
      body.append('file', file);
      const response = await apiFetch<ParseResponse>('/ocr/invoices/parse', { method: 'POST', body }, session.accessToken);
      setForm({
        supplierName: response.draft.supplierName,
        invoiceNumber: response.draft.invoiceNumber,
        invoiceDate: response.draft.invoiceDate,
        items: response.draft.items,
      });
      setWarnings(response.warnings ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingParse(false);
    }
  };

  const confirmImport = async () => {
    if (!session) return;
    setLoadingConfirm(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        supplierName: form.supplierName,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        items: form.items.map((item) => ({
          ...item,
          name: item.name || item.description || '',
          quantity: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          gstRate: Number(item.gstRate || 12),
          amount: Number(item.amount || Number(item.quantity || 0) * Number(item.rate || 0)),
        })),
      };
      const result = await apiFetch<{ success: boolean; invoiceId: string; itemsImported: number }>('/ocr/invoices/confirm', {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session.accessToken);
      setSuccess(`Imported ${result.itemsImported} items. Purchase Invoice ID: ${result.invoiceId}`);
      setFile(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Invoice Scan Onboarding</h1>

      <Card>
        <CardHeader><CardTitle>1. Upload Invoice (Image/PDF)</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={parseFile}>
            <div>
              <Label>Invoice File (Upload)</Label>
              <Input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label>Phone Camera Capture</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button disabled={!file || loadingParse}>{loadingParse ? 'Scanning invoice...' : 'Scan and Parse'}</Button>
          </form>
          {warnings.length > 0 ? (
            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              {warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          ) : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-2 text-sm text-green-700">{success}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Review & Edit Before Import</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Supplier Name</Label><Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} /></div>
            <div><Label>Invoice Number</Label><Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
            <div><Label>Invoice Date</Label><Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} /></div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">SlNo</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">HSN/SAC</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="hidden sm:table-cell">Per</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.items.map((item, index) => {
                const computedAmount = Number(item.quantity || 0) * Number(item.rate || 0);
                return (
                  <TableRow key={`${item.description || item.name || 'row'}-${index}`}>
                    <TableCell className="hidden sm:table-cell"><Input value={item.slNo || String(index + 1)} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, slNo: e.target.value } : r) }))} /></TableCell>
                    <TableCell><Input value={item.description || item.name || ''} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, description: e.target.value, name: e.target.value } : r) }))} /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Input value={item.hsnSac || ''} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, hsnSac: e.target.value } : r) }))} /></TableCell>
                    <TableCell><Input type="number" value={item.quantity} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, quantity: Number(e.target.value || 0) } : r) }))} /></TableCell>
                    <TableCell><Input type="number" value={item.rate} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, rate: Number(e.target.value || 0) } : r) }))} /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Input value={item.per || item.unit || 'PCS'} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, per: e.target.value, unit: e.target.value } : r) }))} /></TableCell>
                    <TableCell><Input type="number" value={item.amount ?? computedAmount} onChange={(e) => setForm((prev) => ({ ...prev, items: prev.items.map((r, i) => i === index ? { ...r, amount: Number(e.target.value || 0) } : r) }))} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground">Approx. taxable total: {totalPreview.toFixed(2)}</p>
          <Button disabled={loadingConfirm || form.items.length === 0} onClick={confirmImport}>
            {loadingConfirm ? 'Importing...' : 'Confirm and Import to Stock'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
