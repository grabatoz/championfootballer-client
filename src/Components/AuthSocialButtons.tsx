'use client';

export default function AuthSocialButtons() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const go = (provider: string) => {
    window.location.href = `${API}/auth/${provider}?next=/home`;
  };
  
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button onClick={() => go('google')}>Continue with Google</button>
      <button onClick={() => go('facebook')}>Continue with Facebook</button>
      <button onClick={() => go('apple')}>Continue with Apple</button>
    </div>
  );
}