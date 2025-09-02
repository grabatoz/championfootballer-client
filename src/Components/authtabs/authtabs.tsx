'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAuth } from '@/lib/hooks';
import { login, register } from '@/lib/features/authSlice';
import { LoginCredentials, RegisterCredentials } from '@/types/api';
import { authAPI } from '@/lib/api';
import {
  Box, TextField, Button, CircularProgress,
  Alert, FormControl, RadioGroup, FormControlLabel,
  Radio, Checkbox, Stack, IconButton,
  Typography} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import toast from 'react-hot-toast';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Link from 'next/link';


interface AuthTabsProps {
  showLogin?: boolean;
  onToggleForm?: () => void;
}

// Prefer server-provided message (works with Axios, fetch, or thunk payloads)
const extractApiMessage = (e: any): string => {
  const axiosMsg = e?.response?.data?.message || e?.response?.data?.error;
  const fetchMsg = e?.data?.message || e?.data?.error;
  const thunkMsg = e?.message || e?.error;
  const str = typeof e === 'string' ? e : undefined;
  return axiosMsg || fetchMsg || thunkMsg || str || 'Something went wrong. Please try again.';
};

// Helper for success payloads that may carry message in different places
const extractSuccessMessage = (r: any, fallback: string) =>
  r?.message || r?.data?.message || fallback;

const AuthTabs = ({ showLogin = true }: AuthTabsProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { dispatch: authDispatch } = useAuth();
  const [tabValue, setTabValue] = useState(showLogin ? 0 : 1);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { isAuthenticated } = useSelector((state: RootState) => state.auth) as { isAuthenticated: boolean };

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

  // Shared input styling for white bg + black text + visible placeholder
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      color: '#000',
      borderRadius: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      '& fieldset': { borderColor: 'transparent' },
      '&:hover fieldset': { borderColor: 'transparent' },
      '&.Mui-focused fieldset': { borderColor: 'transparent' },
      '& input': { color: '#000', fontSize: '1rem' },
    },
    '& input::placeholder': { color: '#757575', opacity: 1 },
    // disable autofill yellow
    '& input:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 1000px #fff inset',
      WebkitTextFillColor: '#000',
      transition: 'background-color 9999s ease-in-out 0s',
    },
  } as const;

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
    // Commented out to avoid double redirect issues
    // if (isAuthenticated) {
    //   router.push('/dashboard');
    // }
  }, [isAuthenticated, router]);

  useEffect(() => {
    setTabValue(showLogin ? 0 : 1);
  }, [showLogin]);

  // const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
  //   setTabValue(newValue);
  //   authDispatch(clearError());
  //   if (onToggleForm) {
  //     onToggleForm();
  //   }
  // };

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
      const msg = 'Please fill in all fields';
      setLoginError(msg);
      toast.error(msg);
      setLoginLoading(false);
      return;
    }

    // Check if user is entering email in password field
    if (loginData.password === loginData.email) {
      const msg = 'It looks like you entered your email in the password field. Please enter your actual password.';
      setLoginError(msg);
      toast.error(msg);
      setLoginLoading(false);
      return;
    }

    // Check if password looks like an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(loginData.password)) {
      const msg = 'It looks like you entered an email address in the password field. Please enter your actual password.';
      setLoginError(msg);
      toast.error(msg);
      setLoginLoading(false);
      return;
    }

    try {
      const result = await authDispatch(login(loginData)).unwrap();
      console.log('[AuthTabs] Login result from server:', result);
      if (result.success) {
        toast.success(result.message || 'Login successful!');
        window.location.href = '/home';
      } else {
        toast.error(extractApiMessage(result));
      }
    } catch (err: unknown) {
      console.error('[AuthTabs] Login submission error:', err);
      toast.error(extractApiMessage(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const validateRegisterForm = () => {
    const age = parseInt(registerData.age);
    let msg = '';
    if (
      !registerData.email || !registerData.password || !registerData.confirmPassword ||
      !registerData.firstName || !registerData.lastName || !registerData.gender || !registerData.age
    ) msg = 'Please fill in all fields';
    else if (registerData.password !== registerData.confirmPassword) msg = 'Passwords do not match';
    else if (registerData.password.length < 6) msg = 'Password must be at least 6 characters';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) msg = 'Invalid email';
    else if (isNaN(age) || age < 18 || age > 65) msg = 'Age must be between 18 and 65';
    else if (!acceptTerms) msg = 'Please accept the terms';
    if (msg) {
      setRegisterError(msg);
      toast.error(msg);
      return false;
    }
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
        if (result.token) localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.data));
        toast.success(result.message || 'Registration successful!');
        window.location.href = '/home';
      } else {
        toast.error(extractApiMessage(result));
      }
    } catch (err: unknown) {
      console.error('[AuthTabs] Register submission error:', err);
      toast.error(extractApiMessage(err));
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotMessage('');
    setForgotError(false);
    if (!loginData.email) {
      const msg = 'Please enter your email above first.';
      setForgotMessage(msg);
      setForgotError(true);
      toast.error(msg);
      return;
    }
    const res = await authAPI.resetPassword(loginData.email);
    if (res.success) {
      const msg = extractSuccessMessage(res, 'Password reset link sent! Check your email.');
      setForgotMessage(msg);
      toast.success(msg);
      setForgotError(false);
    } else {
      const msg = extractApiMessage(res);
      setForgotMessage(msg);
      setForgotError(true);
      toast.error(msg);
    }
  };

  return (
    <>
      {tabValue === 0 ? (
        // Login Form
        <Box component="form" onSubmit={handleLoginSubmit} sx={{width: {sx:'100%',sm:'60%',md:'80%'}, maxWidth: 360, ml:{sx:0,sm:-3.5,md:9.5}}}>
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Stack spacing={3}>

             <TextField 
              fullWidth 
              placeholder="Email address"
               name="email" 
               type="email" 
              autoComplete="email"
              value={loginData.email} 
              onChange={handleLoginChange} 
              required 
// -             InputLabelProps={{ shrink: true }}
// -              sx={{
// -                '& .MuiOutlinedInput-root': {
// -                  backgroundColor: '#e4e4e4',
// -                  color: '#A7A7A7',
// -                  borderRadius: 1,
// -                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // soft shadow
// -                  '& fieldset': {
// -                    borderColor: 'transparent', // No border
// -                  },
// -                  '&:hover fieldset': {
// -                    borderColor: 'transparent',
// -                  },
// -                  '&.Mui-focused fieldset': {
// -                    borderColor: 'transparent',
// -                  },
// -                  '& input': {
// -                    color: '#A7A7A7',
// -                    fontSize: '1rem',
// -                    // fontWeight: 400,
// -                  },
// -                },
// -                '& .MuiInputLabel-root': {
// -                  color: '#A7A7A7',
// -                  // fontSize: '1.5rem',
// -                  // fontWeight: 400,
// -                  '&.Mui-focused': {
// -                    color: '#fff',
// -                  },
// -                },
// -                '& input:-webkit-autofill': {
// -                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
// -                  WebkitTextFillColor: '#A7A7A7',
// -                  transition: 'background-color 5000s ease-in-out 0s',
// -                },
// -                '& input:-webkit-autofill:focus': {
// -                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
// -                  WebkitTextFillColor: '#A7A7A7',
// -                },
// -              }}
              sx={inputSx}
             />

            <TextField 
              fullWidth 
              placeholder="Password"
               name="password" 
               type={showLoginPassword ? "text" : "password"} 
          autoComplete="current-password"
              value={loginData.password} 
              onChange={handleLoginChange} 
              required 
// -             InputLabelProps={{ shrink: true }}
// -                sx={{
// -                '& .MuiOutlinedInput-root': {
// -                  backgroundColor: '#e4e4e4',
// -                  color: '#A7A7A7',
// -                  borderRadius: 1,
// -                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // soft shadow
// -                  '& fieldset': {
// -                    borderColor: 'transparent', // No border
// -                  },
// -                  '&:hover fieldset': {
// -                    borderColor: 'transparent',
// -                  },
// -                  '&.Mui-focused fieldset': {
// -                    borderColor: 'transparent',
// -                  },
// -                  '& input': {
// -                    color: '#A7A7A7',
// -                    fontSize: '1rem',
// -                    // fontWeight: 400,
// -                  },
// -                },
// -                '& .MuiInputLabel-root': {
// -                  color: '#A7A7A7',
// -                  // fontSize: '1.5rem',
// -                  // fontWeight: 400,
// -                  '&.Mui-focused': {
// -                    color: '#A7A7A7',
// -                  },
// -                },
// -                '& input:-webkit-autofill': {
// -                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
// -                  WebkitTextFillColor: '#A7A7A7',
// -                  transition: 'background-color 5000s ease-in-out 0s',
// -                },
// -                '& input:-webkit-autofill:focus': {
// -                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
// -                  WebkitTextFillColor: '#A7A7A7',
// -                },
// -              }}
              sx={inputSx}
               InputProps={{
                 endAdornment: (
                   <IconButton
                     onClick={() => setShowLoginPassword((show) => !show)}
                     edge="end"
                     size="small"
                     sx={{ color: 'white' }}
                   >
                     {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                   </IconButton>
                 ),
               }}
             />
            {/* <TextField 
              fullWidth 
              label="Email Address" 
              name="email" 
              type="email" 
              value={loginData.email} 
              onChange={handleLoginChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#e4e4e4',
                  color: '#A7A7A7',
                  borderRadius: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // soft shadow
                  '& fieldset': {
                    borderColor: 'transparent', // No border
                  },
                  '&:hover fieldset': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'transparent',
                  },
                  '& input': {
                    color: '#A7A7A7',
                    fontSize: '1rem',
                    // fontWeight: 400,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#A7A7A7',
                  // fontSize: '1.5rem',
                  // fontWeight: 400,
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
                  WebkitTextFillColor: '#A7A7A7',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
                  WebkitTextFillColor: '#A7A7A7',
                },
              }}
            />

            <TextField 
              fullWidth 
              label="Password" 
              name="password" 
              type={showLoginPassword ? "text" : "password"} 
              value={loginData.password} 
              onChange={handleLoginChange} 
              required 
               sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#e4e4e4',
                  color: '#A7A7A7',
                  borderRadius: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // soft shadow
                  '& fieldset': {
                    borderColor: 'transparent', // No border
                  },
                  '&:hover fieldset': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'transparent',
                  },
                  '& input': {
                    color: '#A7A7A7',
                    fontSize: '1rem',
                    // fontWeight: 400,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#A7A7A7',
                  // fontSize: '1.5rem',
                  // fontWeight: 400,
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
                  WebkitTextFillColor: '#A7A7A7',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
                  WebkitTextFillColor: '#A7A7A7',
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowLoginPassword((show) => !show)}
                    edge="end"
                    size="small"
                    sx={{ color: 'white' }}
                  >
                    {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            /> */}

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={loginLoading || serverStatus === 'offline'}
              sx={{
                 background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                color: 'white',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                },
                '&:disabled': {
                   background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              {loginLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Button 
                variant="text" 
                onClick={handleForgotPassword} 
                sx={{ 
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  // backgroundColor: '#0B799D',
                  // '&:hover': {
                  //   backgroundColor: '#0B799D',
                  // },
                  width: 'fit-content',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: 1,
                  textAlign: 'center',
                  textDecoration: 'underline',
                }}
              >
                Forgot your password?
              </Button>
            </Box>

            {forgotMessage && (
              <Alert severity={forgotError ? 'error' : 'success'} sx={{ mt: 1 }}>
                {forgotMessage}
              </Alert>
            )}
          </Stack>
        </Box>
              ) : (
          // Register Form - Starts from same position as login form
          <Box component="form" onSubmit={handleRegisterSubmit} sx={{width: {sx:'100%',sm:'60%',md:'80%'}, maxWidth: 360, ml:{sx:0,sm:-3.5,md:9.5}}}>
          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField 
              fullWidth 
              placeholder="Email address"
               name="email" 
               type="email" 
               value={registerData.email} 
               onChange={handleRegisterChange} 
               required 
// -              sx={{
// -                '& .MuiOutlinedInput-root': {
// -                  backgroundColor: '#e4e4e4',
// -                  color: '#A7A7A7',
// -                  borderRadius: 1,
// -                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // soft shadow
// -                  '& fieldset': {
// -                    borderColor: 'transparent', // No border
// -                  },
// -                  '&:hover fieldset': {
// -                    borderColor: 'transparent',
// -                  },
// -                  '&.Mui-focused fieldset': {
// -                    borderColor: 'transparent',
// -                  },
// -                  '& input': {
// -                    color: '#A7A7A7',
// -                    fontSize: '1rem',
// -                  },
// -                },
// -                '& .MuiInputLabel-root': { color: '#A7A7A7', '&.Mui-focused': { color: '#fff' } },
// -                '& input:-webkit-autofill': {
// -                  WebkitBoxShadow: '0 0 0 1000px #e4e4e4 inset',
// -                  WebkitTextFillColor: '#A7A7A7',
// -                  transition: 'background-color 5000s ease-in-out 0s',
// -                },
// -              }}
              sx={inputSx}
             />

            <TextField 
              fullWidth 
              placeholder="Password"
               name="password" 
               type={showRegisterPassword ? "text" : "password"} 
               value={registerData.password} 
               onChange={handleRegisterChange} 
               required 
// -               sx={{
// -                '& .MuiOutlinedInput-root': {
// -                  backgroundColor: '#e4e4e4',
// -                  color: '#A7A7A7',
// -                  borderRadius: 1,
// -                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
// -                  '& fieldset': { borderColor: 'transparent' },
// -                },
// -                '& .MuiInputLabel-root': { color: '#A7A7A7', '&.Mui-focused': { color: '#fff' } },
// -              }}
              sx={inputSx}
               InputProps={{
                 endAdornment: (
                   <IconButton
                     onClick={() => setShowRegisterPassword((show) => !show)}
                     edge="end"
                     size="small"
                     sx={{ color: 'white' }}
                   >
                     {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                   </IconButton>
                 ),
               }}
             />

            <TextField 
              fullWidth 
              placeholder="Confirm password"
               name="confirmPassword" 
               type={showRegisterConfirmPassword ? "text" : "password"} 
               value={registerData.confirmPassword} 
               onChange={handleRegisterChange} 
               required 
// -              sx={{
// -                '& .MuiOutlinedInput-root': {
// -                  backgroundColor: '#e4e4e4',
// -                  color: '#A7A7A7',
// -                  borderRadius: 1,
// -                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
// -                  '& fieldset': { borderColor: 'transparent' },
// -                },
// -              }}
              sx={inputSx}
               InputProps={{
                 endAdornment: (
                   <IconButton
                     onClick={() => setShowRegisterConfirmPassword((show) => !show)}
                     edge="end"
                     size="small"
                     sx={{ color: 'white' }}
                   >
                     {showRegisterConfirmPassword ? <VisibilityOff /> : <Visibility />}
                   </IconButton>
                 ),
               }}
             />

            <TextField 
              fullWidth 
              placeholder="First name"
               name="firstName" 
               value={registerData.firstName} 
               onChange={handleRegisterChange} 
               required 
// -               sx={{
// -                '& .MuiOutlinedInput-root': { backgroundColor: '#e4e4e4', color: '#A7A7A7', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
// -              }}
              sx={inputSx}
             />
            <TextField 
              fullWidth 
              placeholder="Last name"
               name="lastName" 
               value={registerData.lastName} 
               onChange={handleRegisterChange} 
               required 
// -               sx={{
// -                '& .MuiOutlinedInput-root': { backgroundColor: '#e4e4e4', color: '#A7A7A7', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
// -              }}
              sx={inputSx}
             />
            <TextField 
              fullWidth 
              placeholder="Age"
               name="age" 
               type="number" 
               inputProps={{ min: 18, max: 65 }} 
               value={registerData.age} 
               onChange={handleRegisterChange} 
               required 
// -               sx={{
// -                '& .MuiOutlinedInput-root': {
// -                  backgroundColor: '#e4e4e4',
// -                  color: '#A7A7A7',
// -                  borderRadius: 1,
// -                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
// -                  '& fieldset': { borderColor: 'transparent' },
// -                },
// -              }}
              sx={inputSx}
             />

            {/* Active (checked) color set to orange (#E56A16) */}
            <FormControl>
              <Typography sx={{ color: '#fff' }}>Gender</Typography>
              <RadioGroup row name="gender" value={registerData.gender} onChange={handleRegisterChange}>
                <FormControlLabel
                  value="male"
                  control={
                    <Radio
                      sx={{
                        color: '#fff',
                        '&.Mui-checked': { color: '#E56A16' }
                      }}
                    />
                  }
                  label="Male"
                  sx={{ color: '#fff' }}
                />
                <FormControlLabel
                  value="female"
                  control={
                    <Radio
                      sx={{
                        color: '#fff',
                        '&.Mui-checked': { color: '#E56A16' }
                      }}
                    />
                  }
                  label="Female"
                  sx={{ color: '#fff' }}
                />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  sx={{
                    color: '#fff',
                    '&.Mui-checked': { color: '#E56A16' }
                  }}
                />
              }
              // Label contains a link to the terms page
              label={
                <span>
                  I accept the{' '}
                  <Link href="/terms" style={{ color: '#fff', textDecoration: 'underline' }}>
                    terms and conditions
                  </Link>
                </span>
              }

              sx={{ color: '#fff' }}
            />

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={registerLoading}
              sx={{
                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                color: 'white',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                   background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                },
                '&:disabled': {
                   background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);',
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              {registerLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </Stack>
        </Box>
      )}
    </>
  );
};

export default AuthTabs;
