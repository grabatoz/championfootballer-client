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
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div 
        style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #3498db', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}
      />
      <p>Processing authentication...</p>
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

















