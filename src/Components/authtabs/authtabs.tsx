'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAuth } from '@/lib/hooks';
import { login, register } from '@/lib/features/authSlice';
import { LoginCredentials, RegisterCredentials } from '@/types/api';
import { authAPI } from '@/lib/api';
import {
  Box, TextField, Button, CircularProgress,
  Alert, FormControl, FormLabel, RadioGroup, FormControlLabel,
  Radio, Checkbox, Stack, IconButton} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import toast from 'react-hot-toast';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface AuthTabsProps {
  showLogin?: boolean;
  onToggleForm?: () => void;
}

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
        console.log('Redirecting to /dashboard');
        window.location.href = '/home';
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
        window.location.href = '/home';
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
      {tabValue === 0 ? (
        // Login Form
        <Box component="form" onSubmit={handleLoginSubmit}>
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField 
              fullWidth 
              label="Email Address" 
              name="email" 
              type="email" 
              value={loginData.email} 
              onChange={handleLoginChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
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
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
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
            />

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={loginLoading || serverStatus === 'offline'}
              sx={{
                backgroundColor: '#43a047',
                color: 'white',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#388e3c',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
                  backgroundColor: '#0B799D',
                  '&:hover': {
                    backgroundColor: '#0B799D',
                  },
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
          <Box component="form" onSubmit={handleRegisterSubmit}>
          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField 
              fullWidth 
              label="Email Address" 
              name="email" 
              type="email" 
              value={registerData.email} 
              onChange={handleRegisterChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                },
              }}
            />

            <TextField 
              fullWidth 
              label="Password" 
              name="password" 
              type={showRegisterPassword ? "text" : "password"} 
              value={registerData.password} 
              onChange={handleRegisterChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                },
              }}
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
              label="Confirm Password" 
              name="confirmPassword" 
              type={showRegisterConfirmPassword ? "text" : "password"} 
              value={registerData.confirmPassword} 
              onChange={handleRegisterChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                },
              }}
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
              label="First Name" 
              name="firstName" 
              value={registerData.firstName} 
              onChange={handleRegisterChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                },
              }}
            />

            <TextField 
              fullWidth 
              label="Last Name" 
              name="lastName" 
              value={registerData.lastName} 
              onChange={handleRegisterChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                },
              }}
            />

            <TextField 
              fullWidth 
              label="Age" 
              name="age" 
              type="number" 
              inputProps={{ min: 18, max: 65 }} 
              value={registerData.age} 
              onChange={handleRegisterChange} 
              required 
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B799D',
                  color: 'white',
                  borderRadius: 1,
                  '& fieldset': {
                    borderColor: '#fff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#fff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#fff',
                  },
                  '& input': {
                    color: 'white',
                    fontSize: '1rem',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'white',
                  fontSize: '1rem',
                  '&.Mui-focused': {
                    color: '#fff',
                  },
                },
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px #0B799D inset',
                  WebkitTextFillColor: 'white',
                },
              }}
            />

            <FormControl>
              <FormLabel sx={{ color: '#fff' }}>Gender</FormLabel>
              <RadioGroup row name="gender" value={registerData.gender} onChange={handleRegisterChange}>
                <FormControlLabel value="male" control={<Radio color="success" />} label="Male" sx={{ color: '#fff' }} />
                <FormControlLabel value="female" control={<Radio color="success" />} label="Female" sx={{ color: '#fff' }} />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={<Checkbox color="success" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />}
              label="I accept the terms and conditions"
              sx={{ color: '#fff' }}
            />

            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              disabled={registerLoading}
              sx={{
                backgroundColor: '#43a047',
                color: 'white',
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#388e3c',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
