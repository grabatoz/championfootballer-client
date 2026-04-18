'use client';

import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';
import { buildSocialAuthUrl } from '@/lib/clientApiBase';

export default function AuthSocialButtons() {
  const go = (provider: string) => {
    window.location.href = buildSocialAuthUrl(provider, '/home');
  };
  
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: '1px solid #404040',
    borderRadius: '7px',
    backgroundColor: '#ffffff',
    color: '#333',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    height: '40px',
    width: '220px',
    whiteSpace: 'nowrap' as const,
  };

  // const hoverStyle = {
  //   ':hover': {
  //     backgroundColor: '#f5f5f5',
  //     borderColor: '#d0d0d0',
  //     transform: 'translateY(-1px)',
  //     boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  //   }
  // };
  
  return (
    <>
    <div className="auth-social-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', alignItems: 'flex-end', marginTop: '-30px' }}>
      <button 
        onClick={() => go('google')} 
        className="auth-social-btn"
        style={{
          ...buttonStyle,
          border: '1px solid #404040'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.borderColor = '#404040';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#404040';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <FcGoogle size={18} />
        Continue with Google
      </button>
      
      <button 
        onClick={() => go('facebook')} 
        className="auth-social-btn"
        style={{
          ...buttonStyle,
          backgroundColor: '#1877f2',
          border: '1px solid #1877f2',
          color: '#ffffff'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#166fe5';
          e.currentTarget.style.borderColor = '#166fe5';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,119,242,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1877f2';
          e.currentTarget.style.borderColor = '#1877f2';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <FaFacebook size={18} />
        Continue with Facebook
      </button>
      
      <button 
        onClick={() => go('apple')} 
        className="auth-social-btn"
        style={{
          ...buttonStyle,
          backgroundColor: '#000000',
          border: '1px solid #ffffff',
          color: '#ffffff'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#333333';
          e.currentTarget.style.border = '1px solid #ffffff';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#000000';
          e.currentTarget.style.border = '1px solid #ffffff';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <FaApple size={18} />
        Continue with Apple
      </button>
    </div>
    <style jsx>{`
      @media (max-width: 899.95px) {
        .auth-social-wrap {
          align-items: stretch !important;
          margin-top: 0 !important;
        }

        .auth-social-btn {
          width: 100% !important;
        }
      }
    `}</style>
    </>
  );
}
