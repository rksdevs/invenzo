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
  emailSent?: boolean;
  emailSendReason?: string;
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
    setResult(null);
    try {
      const response = await apiFetch<SignupResponse>('/auth/signup-tenant', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(response);
    } catch (err) {
      setForm({ businessName: '', gstin: '', ownerName: '', ownerEmail: '', password: '' });
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-4 sm:p-6">
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
            <div className={`mt-4 rounded-md border p-3 text-sm ${result.emailSent ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              <p>{result.message}</p>
              {result.emailSent ? (
                <p className="mt-1 font-medium">Verification email sent. Please check inbox/spam.</p>
              ) : (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">Email not sent ({result.emailSendReason ?? 'UNKNOWN'}). Use manual verification:</p>
                  <Link className="underline" href={result.verificationLink}>Open verification link</Link>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
