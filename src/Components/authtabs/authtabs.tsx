'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAuth } from '@/lib/hooks';
import { login, register, clearError } from '@/lib/features/authSlice';
import { LoginCredentials, RegisterCredentials } from '@/types/api';
import { authAPI } from '@/lib/api';
import {
  Tabs, Tab, Box, TextField, Button, Typography, CircularProgress,
  Alert, FormControl, FormLabel, RadioGroup, FormControlLabel,
  Radio, Checkbox, Stack, IconButton} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import toast from 'react-hot-toast';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const AuthTabs = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { dispatch: authDispatch } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [loginData, setLoginData] = useState<LoginCredentials>({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerData, setRegisterData] = useState<RegisterCredentials>({
    email: '', password: '', confirmPassword: '', username: '',
    firstName: '', lastName: '', age: '', gender: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
        setServerStatus(res.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };
    checkServerConnection();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
    authDispatch(clearError());
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthTabs] Attempting login with:', loginData);
    setLoginError('');
    setLoginLoading(true);

    if (!loginData.email || !loginData.password) {
      setLoginError('Please fill in all fields');
      setLoginLoading(false);
      return;
    }

    // Check if user is entering email in password field
    if (loginData.password === loginData.email) {
      setLoginError('It looks like you entered your email in the password field. Please enter your actual password.');
      setLoginLoading(false);
      return;
    }

    // Check if password looks like an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(loginData.password)) {
      setLoginError('It looks like you entered an email address in the password field. Please enter your actual password.');
      setLoginLoading(false);
      return;
    }

    try {
      const result = await authDispatch(login(loginData)).unwrap();
      console.log('[AuthTabs] Login result from server:', result);
      if (result.success) {
        toast.success('Login successful!');
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error || 'Login failed.');
      }
    } catch (err: unknown) {
      console.error('[AuthTabs] Login submission error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
      toast.error(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const validateRegisterForm = () => {
    const age = parseInt(registerData.age);
    if (!registerData.email || !registerData.password || !registerData.confirmPassword || !registerData.firstName || !registerData.lastName || !registerData.gender || !registerData.age)
      return setRegisterError('Please fill in all fields'), false;
    if (registerData.password !== registerData.confirmPassword)
      return setRegisterError('Passwords do not match'), false;
    if (registerData.password.length < 6)
      return setRegisterError('Password must be at least 6 characters'), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email))
      return setRegisterError('Invalid email'), false;
    if (isNaN(age) || age < 18 || age > 65)
      return setRegisterError('Age must be between 18 and 65'), false;
    if (!acceptTerms)
      return setRegisterError('Please accept the terms'), false;
    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthTabs] Attempting registration with:', registerData);
    setRegisterError('');
    setRegisterLoading(true);
    if (!validateRegisterForm()) {
      setRegisterLoading(false);
      return;
    }
    try {
      const result = await dispatch(register(registerData)).unwrap();
      console.log('[AuthTabs] Register result from server:', result);
      if (result.success && result.data) {
        if (result.token) {
          localStorage.setItem('token', result.token);
        }
        localStorage.setItem('user', JSON.stringify(result.data));
        toast.success('Registration successful!');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('[AuthTabs] Register submission error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
      toast.error(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotMessage('');
    setForgotError(false);
    if (!loginData.email) {
      setForgotMessage('Please enter your email above first.');
      setForgotError(true);
      return;
    }
    const res = await authAPI.resetPassword(loginData.email);
    if (res.success) {
      setForgotMessage('Password reset link sent! Check your email.');
      setForgotError(false);
    } else {
      setForgotMessage(res.error || 'Failed to send reset link.');
      setForgotError(true);
    }
  };

  return (
    <>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>

      {tabValue === 0 && (
        <Box component="form" onSubmit={handleLoginSubmit}>
          <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
            Server Status:{' '}
            <span style={{ color: serverStatus === 'online' ? 'green' : serverStatus === 'offline' ? 'red' : 'orange' }}>
              {serverStatus === 'checking' ? 'Checking...' : serverStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </Typography>

          {loginError && <Alert severity="error" sx={{ mb: 2 }}>{loginError}</Alert>}

          <Stack spacing={2}>
            <TextField fullWidth label="Email" name="email" type="email" value={loginData.email} onChange={handleLoginChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }} />
            <TextField fullWidth label="Password" name="password" type={showLoginPassword ? "text" : "password"} value={loginData.password} onChange={handleLoginChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowLoginPassword((show) => !show)}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }}
               />
            <Button type="submit" variant="contained" color="success" fullWidth disabled={loginLoading || serverStatus === 'offline'}>
              {loginLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
            <Button variant="text" color="primary" fullWidth onClick={handleForgotPassword} sx={{ mt: -1 }}>
              Forgot Password?
            </Button>
            {forgotMessage && <Alert severity={forgotError ? 'error' : 'success'} sx={{ mt: 1 }}>{forgotMessage}</Alert>}
          </Stack>
        </Box>
      )}

      {tabValue === 1 && (
        <Box component="form" onSubmit={handleRegisterSubmit}>
          {registerError && <Alert severity="error" sx={{ mb: 2 }}>{registerError}</Alert>}

          <Stack spacing={2}>
            <TextField fullWidth label="Email" name="email" type="email" value={registerData.email} onChange={handleRegisterChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }} />
            <TextField fullWidth label="Password" name="password" type={showRegisterPassword ? "text" : "password"} value={registerData.password} onChange={handleRegisterChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowRegisterPassword((show) => !show)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }} />
            <TextField fullWidth label="Confirm Password" name="confirmPassword" type={showRegisterConfirmPassword ? "text" : "password"} value={registerData.confirmPassword} onChange={handleRegisterChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowRegisterConfirmPassword((show) => !show)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showRegisterConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }} />
            <TextField fullWidth label="First Name" name="firstName" value={registerData.firstName} onChange={handleRegisterChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }} />
            <TextField fullWidth label="Last Name" name="lastName" value={registerData.lastName} onChange={handleRegisterChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }} />
            <TextField fullWidth label="Age" name="age" type="number" inputProps={{ min: 18, max: 65 }} value={registerData.age} onChange={handleRegisterChange} size="small" required sx={{
              input: {
                color: 'black',
                backgroundColor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(6px)',
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitTextFillColor: 'black', // keeps white text in autofill
              },
              label: { color: '#ccc' },
              '& .MuiInputLabel-root': {
                color: '#ccc',
              },
              '& input:-webkit-autofill': {
                transition: 'background-color 5000s ease-in-out 0s',
                WebkitBoxShadow: '0 0 0 1000px rgba(255,255,255,0.05) inset',
                WebkitTextFillColor: 'black',
              },
            }}
              InputLabelProps={{
                sx: { color: '#ccc' },
              }} />
            <FormControl>
              <FormLabel>Gender</FormLabel>
              <RadioGroup row name="gender" value={registerData.gender} onChange={handleRegisterChange}>
                <FormControlLabel value="male" control={<Radio color="success" />} label="Male" />
                <FormControlLabel value="female" control={<Radio color="success" />} label="Female" />
              </RadioGroup>
            </FormControl>
            <FormControlLabel
              control={<Checkbox color="success" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />}
              label="I accept the terms and conditions"
            />
            <Button type="submit" variant="contained" color="success" fullWidth disabled={registerLoading}>
              {registerLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </Stack>
        </Box>
      )}
    </>
  );
};

export default AuthTabs;
