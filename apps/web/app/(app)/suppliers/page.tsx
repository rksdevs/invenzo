'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface Supplier { id: string; name: string; gstin?: string; phone?: string; address?: string; }

export default function SuppliersPage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: '', gstin: '', phone: '', address: '' });

  const load = async () => {
    if (!session) return;
    setSuppliers(await apiFetch<Supplier[]>('/suppliers', {}, session.accessToken));
  };
  useEffect(() => { load().catch(() => undefined); }, [session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(form) }, session.accessToken);
    setForm({ name: '', gstin: '', phone: '', address: '' });
    await load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add Supplier</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="md:col-span-2"><Button>Add Supplier</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Suppliers</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">GSTIN</TableHead><TableHead>Phone</TableHead><TableHead className="hidden md:table-cell">Address</TableHead></TableRow></TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}><TableCell>{supplier.name}</TableCell><TableCell className="hidden sm:table-cell">{supplier.gstin ?? '-'}</TableCell><TableCell>{supplier.phone ?? '-'}</TableCell><TableCell className="hidden md:table-cell">{supplier.address ?? '-'}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
