'use client';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthSocialButtons() {
  const go = (p: string) => window.location.href = `${API}/auth/${p}`;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button onClick={() => go('google')}>Continue with Google</button>
      <button onClick={() => go('facebook')}>Continue with Facebook</button>
      <button onClick={() => go('apple')}>Continue with Apple</button>
    </div>
  );
}