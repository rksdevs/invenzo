'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function VerifyEmailPage() {
  const [message, setMessage] = useState('Verifying...');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) {
      setMessage('Missing token');
      return;
    }
    apiFetch<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setOk(true);
        setMessage(res.message);
      })
      .catch((err: Error) => setMessage(err.message));
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader><CardTitle>Email Verification</CardTitle></CardHeader>
        <CardContent>
          <p>{message}</p>
          {ok ? <Link className="mt-2 inline-block underline" href="/login">Go to login</Link> : null}
        </CardContent>
      </Card>
    </div>
  );
}
