'use client';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthSocialButtons() {
  const handleSocialLogin = (provider: string) => {
    const url = `${API}/auth/${provider}?next=/home`;
    console.log('Redirecting to:', url);
    window.location.href = url;
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button onClick={() => handleSocialLogin('google')}>
        Continue with Google
      </button>
      <button onClick={() => handleSocialLogin('facebook')}>
        Continue with Facebook
      </button>
      <button onClick={() => handleSocialLogin('apple')}>
        Continue with Apple
      </button>
    </div>
  );
}