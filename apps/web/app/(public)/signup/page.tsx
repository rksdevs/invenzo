'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

interface SignupResponse {
  message: string;
  verificationLink: string;
}

export default function SignupPage() {
  const [form, setForm] = useState({ businessName: '', gstin: '', ownerName: '', ownerEmail: '', password: '' });
  const [result, setResult] = useState<SignupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<SignupResponse>('/auth/signup-tenant', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader><CardTitle>Create Store Account</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div><Label>Business Name</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
            <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
            <div><Label>Owner Name</Label><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</Button>
          </form>
          {result ? (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm">
              <p>{result.message}</p>
              <Link className="underline" href={result.verificationLink}>Verify account now</Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
