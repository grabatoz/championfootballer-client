'use client';
import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        zIndex: 2147483647,
        top: 12,
        left: 12,
        right: 12,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#333',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          zIndex: 2147483647,
        },
      }}
    />
  );
}
