'use client';

import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaApple } from 'react-icons/fa';

export default function AuthSocialButtons() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const go = (provider: string) => {
    window.location.href = `${API}/auth/${provider}?next=/home`;
  };
  
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px 20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#333',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    minHeight: '48px'
  };

  const hoverStyle = {
    ':hover': {
      backgroundColor: '#f5f5f5',
      borderColor: '#d0d0d0',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  };
  
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: '300px' }}>
      <button 
        onClick={() => go('google')} 
        style={{
          ...buttonStyle,
          border: '1px solid #dadce0'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
          e.currentTarget.style.borderColor = '#dadce0';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.borderColor = '#e0e0e0';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <FcGoogle size={20} />
        Continue with Google
      </button>
      
      <button 
        onClick={() => go('facebook')} 
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
        <FaFacebook size={20} />
        Continue with Facebook
      </button>
      
      <button 
        onClick={() => go('apple')} 
        style={{
          ...buttonStyle,
          backgroundColor: '#000000',
          border: '1px solid #000000',
          color: '#ffffff'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#333333';
          e.currentTarget.style.borderColor = '#333333';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#000000';
          e.currentTarget.style.borderColor = '#000000';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <FaApple size={20} />
        Continue with Apple
      </button>
    </div>
  );
}