'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../components/auth-provider';
import { apiFetch } from '../../../../lib/api';
import { formatCurrency, formatDate } from '../../../../lib/format';
import { Button } from '../../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';

interface PrintPayload {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
    customer?: { name: string; gstin?: string | null } | null;
    tenant: { businessName: string; gstin?: string | null; address?: string | null };
    items: Array<{ description: string; hsnSac: string; quantity: number; rate: number; totalAmount: number }>;
  };
  hsnSummary: Array<{ hsnSac: string; taxable: number; cgst: number; sgst: number; totalTax: number }>;
}

export default function PrintInvoicePage() {
  const { session } = useAuth();
  const [payload, setPayload] = useState<PrintPayload | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    setId(url.searchParams.get('id'));
  }, []);

  useEffect(() => {
    if (!session || !id) return;
    apiFetch<PrintPayload>(`/sales/${id}/print`, {}, session.accessToken).then(setPayload);
  }, [session, id]);

  const amountWords = useMemo(() => {
    const total = Number(payload?.invoice?.totalAmount ?? 0);
    return `INR ${total.toFixed(2)} only`;
  }, [payload]);

  if (!payload) {
    return <div className="p-6">Loading invoice...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl bg-white p-4 text-black sm:p-6">
      <Button className="no-print mb-4" variant="outline" onClick={() => window.print()}>Print A4</Button>
      <h1 className="text-center text-2xl font-bold">TAX INVOICE</h1>
      <p className="text-center text-sm">(ORIGINAL FOR RECIPIENT)</p>

      <div className="mt-4 grid gap-4 border p-3 text-sm md:grid-cols-2">
        <div>
          <p className="font-semibold">{payload.invoice.tenant.businessName}</p>
          <p>GSTIN: {payload.invoice.tenant.gstin ?? '-'}</p>
          <p>{payload.invoice.tenant.address ?? '-'}</p>
        </div>
        <div className="md:text-right">
          <p>Invoice: {payload.invoice.invoiceNumber}</p>
          <p>Date: {formatDate(payload.invoice.invoiceDate)}</p>
          <p>Customer: {payload.invoice.customer?.name ?? 'Walk-in'}</p>
        </div>
      </div>

      <div className="mt-4">
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Description</TableHead><TableHead>HSN</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
          <TableBody>
            {payload.invoice.items.map((item, index) => (
              <TableRow key={`${item.hsnSac}-${index}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.hsnSac}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(item.rate)}</TableCell>
                <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 border p-3 text-sm">
        <h3 className="mb-2 font-semibold">Tax Analysis (HSN)</h3>
        <Table>
          <TableHeader><TableRow><TableHead>HSN/SAC</TableHead><TableHead>Taxable</TableHead><TableHead>CGST</TableHead><TableHead>SGST</TableHead><TableHead>Total Tax</TableHead></TableRow></TableHeader>
          <TableBody>
            {payload.hsnSummary.map((row) => (
              <TableRow key={row.hsnSac}>
                <TableCell>{row.hsnSac}</TableCell>
                <TableCell>{formatCurrency(row.taxable)}</TableCell>
                <TableCell>{formatCurrency(row.cgst)}</TableCell>
                <TableCell>{formatCurrency(row.sgst)}</TableCell>
                <TableCell>{formatCurrency(row.totalTax)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        <div>
          <p>Amount in words:</p>
          <p className="font-medium">{amountWords}</p>
        </div>
        <div className="md:text-right">
          <p>Taxable: {formatCurrency(payload.invoice.taxableValue)}</p>
          <p>CGST: {formatCurrency(payload.invoice.cgstAmount)}</p>
          <p>SGST: {formatCurrency(payload.invoice.sgstAmount)}</p>
          <p className="font-semibold">Grand Total: {formatCurrency(payload.invoice.totalAmount)}</p>
        </div>
      </div>
    </div>
  );
}
