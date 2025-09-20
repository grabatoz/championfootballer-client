import Cookies from 'js-cookie';

export function saveAuthData(userData: any, userId: string, token: string) {
  // Set token in cookie
  Cookies.set('token', token, { 
    expires: 30, 
    path: '/',
    sameSite: 'lax'
  });
  
  // Set user data in localStorage
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('user', JSON.stringify({ id: userId }));
  localStorage.setItem('userData', JSON.stringify(userData));
  
  // Log for debugging
  console.log('[AUTH] Data saved:', {
    user: !!localStorage.getItem('user'),
    userData: !!localStorage.getItem('userData'),
    isAuthenticated: localStorage.getItem('isAuthenticated'),
    token: !!Cookies.get('token')
  });
}

export function clearAuthData() {
  Cookies.remove('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userData');
  localStorage.removeItem('isAuthenticated');
}

export function isAuthenticated() {
  return !!(localStorage.getItem('isAuthenticated') === 'true' && Cookies.get('token'));
}