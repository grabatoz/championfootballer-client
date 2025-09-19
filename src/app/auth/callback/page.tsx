import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

// Force this page to be dynamic (client-side only)
export const dynamic = 'force-dynamic';

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Loading authentication...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackClient />
    </Suspense>
  );
}

















