'use client';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthSocialButtons() {
  const go = (p: string) => window.location.href = `${API}/auth/${p}`;
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?next=/home`;
  };
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button onClick={handleGoogleLogin}>Continue with Google</button>
      <button onClick={() => go('facebook')}>Continue with Facebook</button>
      <button onClick={() => go('apple')}>Continue with Apple</button>
    </div>
  );
}