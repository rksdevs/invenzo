'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

interface UserRow { id: string; name: string; email: string; role: string; isActive: boolean }

export default function SettingsPage() {
  const { session, me, refreshMe } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CASHIER' });

  const loadUsers = async () => {
    if (!session) return;
    setUsers(await apiFetch<UserRow[]>('/users', {}, session.accessToken));
  };

  useEffect(() => { loadUsers().catch(() => undefined); }, [session]);

  const updateBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    const data = new FormData(event.currentTarget);
    await apiFetch('/tenant/me', {
      method: 'PATCH',
      body: JSON.stringify({
        businessName: data.get('businessName'),
        gstin: data.get('gstin'),
        address: data.get('address'),
      }),
    }, session.accessToken);
    await refreshMe();
  };

  const addUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    await apiFetch('/users', { method: 'POST', body: JSON.stringify(form) }, session.accessToken);
    setForm({ name: '', email: '', password: '', role: 'CASHIER' });
    await loadUsers();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Business Profile</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={updateBusiness}>
            <div><Label>Business Name</Label><Input name="businessName" defaultValue={me?.tenant?.businessName ?? ''} /></div>
            <div><Label>GSTIN</Label><Input name="gstin" defaultValue={me?.tenant?.gstin ?? ''} /></div>
            <div><Label>Address</Label><Input name="address" defaultValue={me?.tenant?.address ?? ''} /></div>
            <div className="md:col-span-3"><Button>Save Profile</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-4" onSubmit={addUser}>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><Label>Role</Label><select className="h-10 w-full rounded-md border border-border bg-white px-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>OWNER</option><option>CASHIER</option><option>ACCOUNTANT</option></select></div>
            <div className="md:col-span-4"><Button>Add User</Button></div>
          </form>

          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map((user) => <TableRow key={user.id}><TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell>{user.isActive ? 'Active' : 'Disabled'}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
