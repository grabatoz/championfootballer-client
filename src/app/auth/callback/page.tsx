import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p style={{ padding: 16 }}>Signing you in…</p>}>
      <CallbackClient />
    </Suspense>
  );
}

















