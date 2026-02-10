"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAuth } from "@/lib/hooks"
import { login, register } from "@/lib/features/authSlice"
import type { LoginCredentials, RegisterCredentials } from "@/types/api"
import { authAPI } from "@/lib/api"
import Cookies from "js-cookie"
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Stack,
  IconButton,
  Typography,
  Select,
  MenuItem,
  // InputLabel,
  OutlinedInput,
  InputAdornment,
  useMediaQuery,
} from "@mui/material"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import toast from "react-hot-toast"
import { Visibility, VisibilityOff, Facebook, Apple } from "@mui/icons-material"
import Link from "next/link"
import { authStorage, type UserDataShape, type UserProfile } from "@/lib/authStorage"
import type { User } from "@/types/user"
import { Country, State, City } from 'country-state-city'

interface AuthTabsProps {
  showLogin?: boolean
  onToggleForm?: () => void
}

// Server payload shapes
type ApiMessagePayload = { message?: string; error?: string }

type AxiosErrorLike = { response?: { data?: ApiMessagePayload } }
type FetchErrorLike = { data?: ApiMessagePayload }
type ThunkErrorLike = { message?: string; error?: string }

// Prefer server-provided message (works with Axios, fetch, or thunk payloads)
const extractApiMessage = (e: unknown): string => {
  if (typeof e === "string") return e
  const axios = (e as AxiosErrorLike).response?.data
  const fetch = (e as FetchErrorLike).data
  const thunk = e as ThunkErrorLike
  return (
    axios?.message ??
    axios?.error ??
    fetch?.message ??
    fetch?.error ??
    thunk?.message ??
    thunk?.error ??
    "Something went wrong. Please try again."
  )
}

// Helper for success payloads that may carry message in different places
type WithMessage = { message?: string }
type WithDataMessage = { data?: { message?: string } }

const hasMessage = (v: unknown): v is WithMessage => typeof v === "object" && v !== null && "message" in v

const hasDataMessage = (v: unknown): v is WithDataMessage => typeof v === "object" && v !== null && "data" in v

const extractSuccessMessage = (r: unknown, fallback: string): string => {
  if (hasMessage(r) && r.message) return r.message
  if (hasDataMessage(r)) {
    const msg = r.data?.message
    if (msg) return msg
  }
  return fallback
}

// Helper to normalize User to UserProfile
const normalizeUserForStorage = (user: User): UserProfile => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    age: typeof user.age === "string" ? Number(user.age) || undefined : user.age,
    gender: user.gender,
    country: user.country ?? null,
    state: user.state ?? null,
    city: user.city ?? null,
    position: user.position,
    positionType: user.positionType,
    style: user.style,
    preferredFoot: user.preferredFoot,
    shirtNumber: typeof user.shirtNumber === "string" ? Number(user.shirtNumber) || undefined : user.shirtNumber,
    profilePicture: user.profilePicture || null,
    image: user.profilePicture || null,
    skills: user.skills,
  }
}

// Helper to normalize API response data to UserDataShape
const normalizeUserData = (data: User): UserDataShape => {
  return {
    joinedLeagues: (data.joinedLeagues || []).map(league => ({
      id: String(league.id || ''),
      name: league.name || '',
    })),
    managedLeagues: (data.managedLeagues || []).map(league => ({
      id: String(league.id || ''),
      name: league.name || '',
    })),
    homeTeamMatches: (data.homeTeamMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    })),
    awayTeamMatches: (data.awayTeamMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED  ',
    })),
    availableMatches: (data.availableMatches || []).map(match => ({
      id: String(match.id || ''),
      homeTeamGoals: Number(match.homeTeamGoals || 0),
      awayTeamGoals: Number(match.awayTeamGoals || 0),
      status: (match.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    })),
    guestMatch: data.guestMatch ? {
      id: String(data.guestMatch.id || ''),
      homeTeamGoals: Number(data.guestMatch.homeTeamGoals || 0),
      awayTeamGoals: Number(data.guestMatch.awayTeamGoals || 0),
      status: (data.guestMatch.status as 'RESULT_PUBLISHED' | 'SCHEDULED' | 'ONGOING') || 'SCHEDULED',
    } : null,
  };
}

const GoogleIcon = () => (
<svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  <path fill="none" d="M0 0h48v48H0z"/>
</svg>
)

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.15 5.96C15.21 5.96 16.12 6.04 16.38 6.08V8.7H14.85C13.67 8.7 13.44 9.23 13.44 9.99V12.06H16.34L15.88 14.96H13.44V21.96C18.21 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"
    />
  </svg>
)

const AuthTabs = ({ showLogin = true }: AuthTabsProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { dispatch: authDispatch } = useAuth()
  const [tabValue, setTabValue] = useState(showLogin ? 0 : 1)
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking")
  const { isAuthenticated } = useSelector((state: RootState) => state.auth) as { isAuthenticated: boolean }

  const isDesktop = useMediaQuery("(min-width:900px)")

  const [loginData, setLoginData] = useState<LoginCredentials>({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [registerData, setRegisterData] = useState<RegisterCredentials>({
    email: "",
    password: "",
    phone: "",
    confirmPassword: "",
    username: "",
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    country: "",
    state: "",
    city: "",
  })
  const [registerError, setRegisterError] = useState("")
  const [registerLoading, setRegisterLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotError, setForgotError] = useState(false)

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")

  // Location selectors state (codes used to derive dependent lists)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")

  // Desktop: City/State dropdown (we map it to state/city strings for backend compatibility)
  const [selectedStateCode, setSelectedStateCode] = useState<string>("")

  // Phone country code selector (independent of profile country)
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("AE")

  // Shared input styling for white bg + black text + visible placeholder
  const inputSx = {
    width: { xs: '100%', md: '220px' },
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      color: "#000",
      borderRadius: '7px',
      height: { xs: 'auto', md: '40px' },
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      overflow: "hidden",
      boxSizing: "border-box",
      "& fieldset": { borderColor: "#404040", borderWidth: '1px' },
      "&:hover fieldset": { borderColor: "#404040" },
      "&.Mui-focused fieldset": { borderColor: "#404040" },
      "& input": { 
        color: "#000", 
        fontSize: "0.95rem",
        height: "100%",
        boxSizing: "border-box",
        padding: "0 14px",
      },
    },
    "& input::placeholder": { color: "#757575", opacity: 1 },
    // disable autofill yellow
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #fff inset !important",
      WebkitTextFillColor: "#000 !important",
      transition: "background-color 5000s ease-in-out 0s",
      borderRadius: '7px !important',
    },
    "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
      WebkitBoxShadow: "0 0 0 1000px #fff inset !important",
      WebkitTextFillColor: "#000 !important",
      borderRadius: '7px !important',
    },
  } as const

  // Exact sizes from Figma (desktop)
  const FIGMA_HALF_WIDTH = 466.1052551269531
  const FIGMA_FULL_WIDTH = 948.3947143554688
  // Visually matches the provided screenshot better than the raw measured height.
  const FIGMA_HEIGHT = 40
  const FIGMA_RADIUS = 5
  const FIGMA_GAP = FIGMA_FULL_WIDTH - FIGMA_HALF_WIDTH * 2

  // Register fields in the screenshots are taller and have radius 5.
  const registerInputSx = {
    ...inputSx,
    width: '100%',
    "& .MuiOutlinedInput-root": {
      ...(inputSx as any)["& .MuiOutlinedInput-root"],
      borderRadius: `${FIGMA_RADIUS}px`,
      height: { xs: '56px', md: `${FIGMA_HEIGHT}px` },
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
  } as const

  const registerSelectSx = {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: `${FIGMA_RADIUS}px`,
    height: { xs: '56px', md: `${FIGMA_HEIGHT}px` },
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#404040', borderWidth: '1px' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#404040' },
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      height: '100%',
      boxSizing: 'border-box',
    },
    '& .MuiSelect-icon': { color: '#404040' },
  } as const

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
        setServerStatus(res.ok ? "online" : "offline")
      } catch {
        setServerStatus("offline")
      }
    }
    checkServerConnection()
  }, [])

  useEffect(() => {
    // Commented out to avoid double redirect issues
    // if (isAuthenticated) {
    //   router.push('/dashboard');
    // }
  }, [isAuthenticated, router])

  useEffect(() => {
    setTabValue(showLogin ? 0 : 1)
  }, [showLogin])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value })
  }

  const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,16}$/
  const getPasswordError = (pw: string): string => {
    if (!pw) return "Password is required"
    if (pw.length < 6) return "Minimum 6 characters required"
    if (pw.length > 16) return "Maximum 16 characters allowed"
    if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter"
    if (!/[0-9]/.test(pw)) return "Include at least one number"
    if (!/[^A-Za-z0-9]/.test(pw)) return "Include at least one special character"
    return ""
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const next = { ...registerData, [name]: value }
    setRegisterData(next)

    if (name === "password") {
      setPasswordError(getPasswordError(value))
      // also re-validate confirm when password changes
      setConfirmError(next.confirmPassword && next.confirmPassword !== value ? "Passwords do not match" : "")
    }
    if (name === "confirmPassword") {
      setConfirmError(value && value !== next.password ? "Passwords do not match" : "")
    }
  }

  // Derived lists from country-state-city library
  const countries = Country.getAllCountries()
  const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []
  // If we had a state selection we'd derive cities; now we allow free text entry so we don't need the cities list.
  const cities: Array<never> = []

  const isoToFlagEmoji = (isoCode: string): string => {
    const code = (isoCode || "").toUpperCase()
    if (!/^[A-Z]{2}$/.test(code)) return ""
    return code.replace(/[A-Z]/g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
  }

  // Handlers for Select components; store name in registerData, code in local state
  const handleCountrySelect = (code: string) => {
    setSelectedCountryCode(code)
    const c = countries.find(c => c.isoCode === code)
    // Reset location fields when country changes
    setSelectedStateCode("")
    setRegisterData(prev => ({ ...prev, country: c?.name || "", state: "", city: "" }))
  }

  const handleStateSelect = (code: string) => {
    setSelectedStateCode(code)
    const s = states.find(s => s.isoCode === code)
    const name = s?.name || ""
    // Store same value for city/state to align with existing backend compatibility.
    setRegisterData(prev => ({ ...prev, state: name, city: name }))
  }

  // Single location input handler: store the value in both state and city for backward compatibility.
  const handleLocationInput = (value: string) => {
    setRegisterData(prev => ({ ...prev, city: value, state: value }))
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[AuthTabs] Attempting login with:", loginData)
    setLoginError("")
    setLoginLoading(true)

    if (!loginData.email || !loginData.password) {
      const msg = "Please fill in all fields"
      setLoginError(msg)
      toast.error(msg)
      setLoginLoading(false)
      return
    }

    if (loginData.password === loginData.email) {
      const msg = "It looks like you entered your email in the password field. Please enter your actual password."
      setLoginError(msg)
      toast.error(msg)
      setLoginLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(loginData.password)) {
      const msg = "It looks like you entered an email address in the password field. Please enter your actual password."
      setLoginError(msg)
      toast.error(msg)
      setLoginLoading(false)
      return
    }

    try {
      const result = await authDispatch(login(loginData)).unwrap()
      console.log("[AuthTabs] Login result from server:", result)
      if (result.success) {
        if (result.token && result.data) {
          // Use the helper functions to normalize data
          const normalizedUser = normalizeUserForStorage(result.data)
          const userData = normalizeUserData(result.data)
          
          // Save auth data
          const saved = authStorage.saveAuthExact(normalizedUser, userData, result.token)
          console.log("[AuthTabs] Token saved:", saved)
          
          // ✨ Wait for cookies to be set properly
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Verify token was saved
          const token = Cookies.get('token')
          console.log("[AuthTabs] Token verification:", {
            hasCookie: !!token,
            tokenLength: token?.length
          })
        }
        toast.success(result.message || "Login successful!")
        
        // ✨ Small delay before redirect to ensure cookies are set
        setTimeout(() => {
          window.location.href = "/home"
        }, 150)
      } else {
        toast.error(extractApiMessage(result))
      }
    } catch (err: unknown) {
      console.error("[AuthTabs] Login submission error:", err)
      toast.error(extractApiMessage(err))
    } finally {
      setLoginLoading(false)
    }
  }

  const validateRegisterForm = () => {
    const age = Number.parseInt(registerData.age)
    let msg = ""
    if (
      !registerData.email ||
      !registerData.phone ||
      !registerData.password ||
      !registerData.confirmPassword ||
      !registerData.firstName ||
      !registerData.lastName ||
      !registerData.gender ||
      !registerData.age ||
      !registerData.country ||
      !registerData.city
    )
      msg = "Please fill in all fields"
    else if (!passwordPattern.test(registerData.password)) {
      msg = "Password must be 6-16 characters and include 1 uppercase, 1 number and 1 special character"
      setPasswordError(getPasswordError(registerData.password))
    }
    else if (registerData.password !== registerData.confirmPassword) {
      msg = "Passwords do not match"
      setConfirmError("Passwords do not match")
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) msg = "Invalid email"
    else if (isNaN(age) || age < 18 || age > 65) msg = "Age must be between 18 and 65"
    else if (!acceptTerms) msg = "Please accept the terms"
    if (msg) {
      setRegisterError(msg)
      toast.error(msg)
      return false
    }
    return true
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[AuthTabs] Attempting registration with:", registerData)
    setRegisterError("")
    setRegisterLoading(true)
    if (!validateRegisterForm()) {
      setRegisterLoading(false)
      return
    }
    try {
      const result = await dispatch(register(registerData)).unwrap()
      console.log("[AuthTabs] Register result from server:", result)
      if (result.success && result.data) {
        if (result.token) {
          // Use the helper functions to normalize data
          const normalizedUser = normalizeUserForStorage(result.data)
          const userData = normalizeUserData(result.data)
          
          // Save auth data
          const saved = authStorage.saveAuthExact(normalizedUser, userData, result.token)
          console.log("[AuthTabs] Token saved:", saved)
          
          // ✨ Wait for cookies to be set properly
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Verify token was saved
          const token = Cookies.get('token')
          console.log("[AuthTabs] Token verification:", {
            hasCookie: !!token,
            tokenLength: token?.length
          })
        }
        toast.success(result.message || "Registration successful!")
        
        // ✨ Small delay before redirect to ensure cookies are set
        setTimeout(() => {
          window.location.href = "/home"
        }, 150)
      } else {
        toast.error(extractApiMessage(result))
      }
    } catch (err: unknown) {
      console.error("[AuthTabs] Register submission error:", err)
      toast.error(extractApiMessage(err))
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setForgotMessage("")
    setForgotError(false)
    if (!loginData.email) {
      const msg = "Please enter your email above first."
      setForgotMessage(msg)
      setForgotError(true)
      toast.error(msg)
      return
    }
    const res = await authAPI.resetPassword(loginData.email)
    if (res.success) {
      const msg = extractSuccessMessage(res, "Password reset link sent! Check your email.")
      setForgotMessage(msg)
      toast.success(msg)
      setForgotError(false)
    } else {
      const msg = extractApiMessage(res)
      setForgotMessage(msg)
      setForgotError(true)
      toast.error(msg)
    }
  }

  return (
    <>
      {tabValue === 0 ? (
        // Login Form
        <Box
          component="form"
          onSubmit={handleLoginSubmit}
          sx={{ width: { sx: "100%", sm: "60%", md: "70%" }, maxWidth: 33200, marginLeft: 'auto' }}
        >
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              placeholder="Email address"
              name="email"
              type="email"
              autoComplete="email"
              value={loginData.email}
              onChange={handleLoginChange}
              required
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
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowLoginPassword((show) => !show)}
                    edge="end"
                    size="small"
                    sx={{ color: "#000" }}
                  >
                    {showLoginPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loginLoading || serverStatus === "offline"}
              sx={{
                background: "#00a77f",
                color: "white",
                width: { xs: '100%', md: '220px' },
                height: { xs: 'auto', md: '40px' },
                fontSize: "0.95rem",
                fontWeight: "bold",
                borderRadius: '7px',
                textTransform: "none",
                "&:hover": {
                  background: "#00a77f",
                },
                "&:disabled": {
                  background: "#00a77f",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {loginLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>

            <Box sx={{ display: "flex", justifyContent: "center", width: "220px" }}>
              <Button
                variant="text"
                onClick={handleForgotPassword}
               sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  width: "fit-content",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  textDecoration: "underline",
                  mt: -0.5,
                  mb: 2,
                  padding: 0,
                }}
              >
                Forgot your password?
              </Button>
            </Box>

            {forgotMessage && (
              <Alert severity={forgotError ? "error" : "success"} sx={{ mt: 1 }}>
                {forgotMessage}
              </Alert>
            )}
          </Stack>
        </Box>
      ) : (
        // Register Form - Starts from same position as login form
        <Box
          component="form"
          onSubmit={handleRegisterSubmit}
          sx={{
            width: { xs: '100%', sm: '100%', md: '100%' },
            maxWidth: { md: '948.3947px' },
            marginLeft: 'auto',
            marginRight: 'auto',
            mb: 2,
          }}
        >
          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              columnGap: { xs: 0, md: `${FIGMA_GAP}px` },
              rowGap: { xs: 1.25, md: 2 },
              alignItems: 'start',
              justifyContent: { xs: 'stretch', md: 'start' },
            }}
          >
            {/* NAME */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' } }}>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Name</Typography>
              <TextField
                fullWidth
                placeholder="First Name"
                name="firstName"
                value={registerData.firstName}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
              />
            </Box>

            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' } }}>
              <Typography sx={{ mb: 0.75, color: 'transparent', fontSize: '0.9rem', display: { xs: 'none', md: 'block' }, userSelect: 'none' }}>Name</Typography>
              <TextField
                fullWidth
                placeholder="Last Name"
                name="lastName"
                value={registerData.lastName}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
              />
            </Box>

            {/* EMAIL */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Email</Typography>
              <TextField
                fullWidth
                placeholder="Email Address"
                name="email"
                type="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
              />
            </Box>

            {/* PHONE */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Enter Your Phone Number</Typography>
              <TextField
                fullWidth
                placeholder="Enter Number"
                name="phone"
                value={registerData.phone || ''}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ height: '100%' }}>
                      <Select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value as string)}
                        variant="standard"
                        disableUnderline
                        MenuProps={{
                          disablePortal: true,
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                          PaperProps: {
                            sx: {
                              maxHeight: 300,
                              maxWidth: '300px',
                              marginLeft: '10px',
                            },
                          },
                        }}
                        sx={{
                          minWidth: 80,
                          mr: 1,
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          '& .MuiSelect-select': {
                            color: '#000',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          },
                        }}
                        renderValue={(selected) => {
                          const code = selected as string
                          const c = countries.find(cc => cc.isoCode === code)
                          const phone = c?.phonecode ? `+${c.phonecode}` : ''
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box component="span" sx={{ color: '#000' }}>
                                {code} {phone}
                              </Box>
                            </Box>
                          )
                        }}
                      >
                        {countries.map(c => (
                          <MenuItem key={c.isoCode} value={c.isoCode}>
                            <Box component="span" sx={{ color: '#000' }}>{c.name}</Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* PASSWORD */}
            <Box>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Password</Typography>
              <TextField
                fullWidth
                placeholder="Password"
                name="password"
                type={showRegisterPassword ? 'text' : 'password'}
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
                inputProps={{ minLength: 6, maxLength: 16, pattern: '(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,16}' }}
                error={Boolean(passwordError)}
                helperText={passwordError || '6-16 chars, 1 uppercase, 1 number, 1 special'}
                FormHelperTextProps={{ sx: { display: { xs: 'block', md: 'none' } } }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowRegisterPassword((show) => !show)}
                      edge="end"
                      size="small"
                      sx={{ color: '#000' }}
                    >
                      {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Re-Type Password</Typography>
              <TextField
                fullWidth
                placeholder="Confirm Password"
                name="confirmPassword"
                type={showRegisterConfirmPassword ? 'text' : 'password'}
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
                inputProps={{ minLength: 6, maxLength: 16, pattern: '(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,16}' }}
                error={Boolean(confirmError)}
                helperText={confirmError || 'Re-type your password'}
                FormHelperTextProps={{ sx: { display: { xs: 'block', md: 'none' } } }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowRegisterConfirmPassword((show) => !show)}
                      edge="end"
                      size="small"
                      sx={{ color: '#000' }}
                    >
                      {showRegisterConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Box>

            {/* AGE + GENDER */}
            <Box>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Enter Age</Typography>
              <TextField
                fullWidth
                placeholder="Age"
                name="age"
                type="number"
                inputProps={{ min: 18, max: 65 }}
                value={registerData.age}
                onChange={handleRegisterChange}
                required
                sx={registerInputSx}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Select Gender</Typography>
              {isDesktop ? (
                <FormControl fullWidth>
                  <Select
                    value={registerData.gender}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, gender: e.target.value as string }))
                    }
                    displayEmpty
                    input={<OutlinedInput notched={false} />}
                    sx={registerSelectSx}
                    renderValue={(selected) => {
                      if (!selected) return <span style={{ color: '#757575' }}>Gender</span>
                      return selected === 'male' ? 'Male' : 'Female'
                    }}
                    required
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <FormControl>
                  <RadioGroup row name="gender" value={registerData.gender} onChange={handleRegisterChange}>
                    <FormControlLabel
                      value="male"
                      control={<Radio sx={{ color: 'black', '&.Mui-checked': { color: '#E56A16' } }} />}
                      label="Male"
                      sx={{ color: 'black' }}
                    />
                    <FormControlLabel
                      value="female"
                      control={<Radio sx={{ color: 'black', '&.Mui-checked': { color: '#E56A16' } }} />}
                      label="Female"
                      sx={{ color: 'black' }}
                    />
                  </RadioGroup>
                </FormControl>
              )}
            </Box>

            {/* COUNTRY + CITY/STATE */}
            <Box>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Select Country/Region</Typography>
              <FormControl fullWidth>
                <Select
                  id="country-select"
                  value={selectedCountryCode}
                  onChange={(e) => handleCountrySelect(e.target.value as string)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return <span style={{ color: '#757575' }}>Country/Region</span>
                    const code = selected as string
                    const c = countries.find(c => c.isoCode === code)
                    return c?.name || ''
                  }}
                  input={<OutlinedInput notched={false} />}
                  sx={registerSelectSx}
                  required
                >
                  <MenuItem value="" disabled>
                    <em>Country/Region</em>
                  </MenuItem>
                  {countries.map(c => (
                    <MenuItem key={c.isoCode} value={c.isoCode}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.75, color: '#000', fontSize: '0.9rem' }}>Select City/State</Typography>
              {isDesktop ? (
                <FormControl fullWidth>
                  <Select
                    id="state-select"
                    value={selectedStateCode}
                    onChange={(e) => handleStateSelect(e.target.value as string)}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) return <span style={{ color: '#757575' }}>City/State</span>
                      const code = selected as string
                      const s = states.find(s => s.isoCode === code)
                      return s?.name || ''
                    }}
                    input={<OutlinedInput notched={false} />}
                    sx={registerSelectSx}
                    required
                    disabled={!selectedCountryCode}
                  >
                    <MenuItem value="" disabled>
                      <em>City/State</em>
                    </MenuItem>
                    {states.map(s => (
                      <MenuItem key={s.isoCode} value={s.isoCode}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  placeholder="City / State"
                  name="location"
                  value={registerData.city}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  required
                  sx={registerInputSx}
                  helperText="Enter your city, town or state"
                />
              )}
            </Box>

            {/* TERMS */}
            <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, mt: { xs: 0.5, md: 0.25 } }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    sx={{
                      color: 'black',
                      '&.Mui-checked': { color: '#E56A16' },
                    }}
                  />
                }
                label={
                  <span className="text-black">
                    I accept the{' '}
                    <Link href="/terms" style={{ color: 'black', textDecoration: 'underline' }}>
                      terms and conditions
                    </Link>
                  </span>
                }
                sx={{ color: '#fff' }}
              />
            </Box>

            {/* BUTTONS: Register + social (match screenshot grid) */}
            <Button
              type="submit"
              variant="contained"
              disabled={registerLoading}
              sx={{
                gridColumn: { xs: '1 / -1', md: 'span 1' },
                height: { xs: '56px', md: `${FIGMA_HEIGHT}px` },
                borderRadius: `${FIGMA_RADIUS}px`,
                background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                color: 'white',
                fontSize: '1.05rem',
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                },
                '&:disabled': {
                  background: 'linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {registerLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>

            {/* Social auth buttons (desktop: to the right of Register; next row: FB/Apple) */}
            {(() => {
              const API = process.env.NEXT_PUBLIC_API_URL
              const go = (provider: string) => {
                window.location.href = `${API}/auth/${provider}?next=/home`
              }

              const socialBase = {
                height: { xs: '56px', md: `${FIGMA_HEIGHT}px` },
                borderRadius: `${FIGMA_RADIUS}px`,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
              } as const

              return (
                <>
                  <Button
                    onClick={() => go('google')}
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    sx={{
                      ...socialBase,
                      gridColumn: { xs: '1 / -1', md: 'span 1' },
                      borderColor: '#404040',
                      color: '#000',
                      backgroundColor: '#fff',
                      '&:hover': { borderColor: '#404040', backgroundColor: '#f8f9fa' },
                    }}
                  >
                    Continue with Google
                  </Button>

                  <Button
                    onClick={() => go('facebook')}
                    variant="contained"
                    startIcon={<FacebookIcon />}
                    sx={{
                      ...socialBase,
                      gridColumn: { xs: '1 / -1', md: 'span 1' },
                      backgroundColor: '#1877f2',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#166fe5' },
                    }}
                  >
                    Continue with Facebook
                  </Button>

                  <Button
                    onClick={() => go('apple')}
                    variant="contained"
                    startIcon={<Apple sx={{ fontSize: '28px' }} />}
                    sx={{
                      ...socialBase,
                      gridColumn: { xs: '1 / -1', md: 'span 1' },
                      backgroundColor: '#000',
                      color: '#fff',
                      border: '1px solid #000',
                      '&:hover': { backgroundColor: '#333', border: '1px solid #000' },
                    }}
                  >
                    Continue with Apple
                  </Button>
                </>
              )
            })()}
          </Box>
        </Box>
      )}
    </>
  )
}

export default AuthTabs
