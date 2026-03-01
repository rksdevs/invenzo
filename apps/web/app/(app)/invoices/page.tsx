'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/format';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Sale { id: string; invoiceNumber: string; invoiceDate: string; totalAmount: number; }

export default function InvoicesPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Sale[]>([]);

  useEffect(() => {
    if (!session) return;
    apiFetch<Sale[]>('/sales', {}, session.accessToken).then(setRows);
  }, [session]);

  return (
    <Card>
      <CardHeader><CardTitle>Customer Invoices</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.invoiceNumber}</TableCell>
                <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                <TableCell>{formatCurrency(row.totalAmount)}</TableCell>
                <TableCell><Button asChild variant="outline" size="sm"><Link href={`/invoices/print?id=${row.id}`}>Print</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
