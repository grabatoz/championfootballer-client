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
} from "@mui/material"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import toast from "react-hot-toast"
import { Visibility, VisibilityOff } from "@mui/icons-material"
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

const AuthTabs = ({ showLogin = true }: AuthTabsProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { dispatch: authDispatch } = useAuth()
  const [tabValue, setTabValue] = useState(showLogin ? 0 : 1)
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking")
  const { isAuthenticated } = useSelector((state: RootState) => state.auth) as { isAuthenticated: boolean }

  const [loginData, setLoginData] = useState<LoginCredentials>({ email: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [registerData, setRegisterData] = useState<RegisterCredentials>({
    email: "",
    password: "",
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
  // State removed from UI; we keep it internally for compatibility but user enters a single City/State value
  const [selectedStateCode] = useState<string>("")

  // Shared input styling for white bg + black text + visible placeholder
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      color: "#000",
      borderRadius: 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      "& fieldset": { borderColor: "transparent" },
      "&:hover fieldset": { borderColor: "transparent" },
      "&.Mui-focused fieldset": { borderColor: "transparent" },
      "& input": { color: "#000", fontSize: "1rem" },
    },
    "& input::placeholder": { color: "#757575", opacity: 1 },
    // disable autofill yellow
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px #fff inset",
      WebkitTextFillColor: "#000",
      transition: "background-color 9999s ease-in-out 0s",
    },
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

  // Handlers for Select components; store name in registerData, code in local state
  const handleCountrySelect = (code: string) => {
    setSelectedCountryCode(code)
    const c = countries.find(c => c.isoCode === code)
    // Reset location fields when country changes
    setRegisterData(prev => ({ ...prev, country: c?.name || "", state: "", city: "" }))
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
          sx={{ width: { sx: "100%", sm: "60%", md: "80%" }, maxWidth: 360, ml: { sx: 0, sm: -3.5, md: 9.5 } }}
        >
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Stack spacing={1}>
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
              fullWidth
              disabled={loginLoading || serverStatus === "offline"}
              sx={{
                background: "linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);",
                color: "white",
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);",
                },
                "&:disabled": {
                  background: "linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {loginLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
            </Button>

            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Button
                variant="text"
                onClick={handleForgotPassword}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontSize: "0.9rem",
                  width: "fit-content",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  gap: 1,
                  textAlign: "center",
                  textDecoration: "underline",
                  mt: -1,
                  mb: 1,
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
          sx={{ width: { sx: "100%", sm: "60%", md: "80%" }, maxWidth: 360, ml: { sx: 0, sm: -3.5, md: 5 } , mb:7 }}
        >
          {registerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registerError}
            </Alert>
          )}

          <Stack spacing={1}>
            <TextField
              fullWidth
              placeholder="Email address"
              name="email"
              type="email"
              value={registerData.email}
              onChange={handleRegisterChange}
              required
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
              sx={inputSx}
              inputProps={{ minLength: 6, maxLength: 16, pattern: '(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,16}' }}
              error={Boolean(passwordError)}
              helperText={passwordError || "6-16 chars, 1 uppercase, 1 number, 1 special"}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowRegisterPassword((show) => !show)}
                    edge="end"
                    size="small"
                    sx={{ color: "#000" }}
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
              sx={inputSx}
              inputProps={{ minLength: 6, maxLength: 16, pattern: '(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,16}' }}
              error={Boolean(confirmError)}
              helperText={confirmError || "Re-type your password"}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowRegisterConfirmPassword((show) => !show)}
                    edge="end"
                    size="small"
                    sx={{ color: "#000" }}
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
              sx={inputSx}
            />
            <TextField
              fullWidth
              placeholder="Last name"
              name="lastName"
              value={registerData.lastName}
              onChange={handleRegisterChange}
              required
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
              sx={inputSx}
            />

            <FormControl fullWidth>
              {/* InputLabel removed; provide OutlinedInput notched={false} for full outline */}
              <Select
                id="country-select"
                value={selectedCountryCode}
                onChange={(e) => handleCountrySelect(e.target.value as string)}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) return <span style={{ color: '#757575' }}>Country / Region</span>;
                  const code = selected as string;
                  const c = countries.find(c => c.isoCode === code);
                  return c?.name || '';
                }}
                input={<OutlinedInput notched={false} />}
                sx={{
                  '& .MuiSelect-select': { backgroundColor: '#fff', color: '#000' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                }}
                required
              >
                <MenuItem value="" disabled>
                  <em>Country / Region</em>
                </MenuItem>
                {countries.map(c => (
                  <MenuItem key={c.isoCode} value={c.isoCode}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              placeholder="City / State"
              name="location"
              value={registerData.city}
              onChange={(e) => handleLocationInput(e.target.value)}
              required
              sx={inputSx}
              helperText="Enter your city, town or state"
            />

            {/* Active (checked) color set to orange (#E56A16) */}
            <FormControl>
              <Typography sx={{ color: "black" }}>Gender</Typography>
              <RadioGroup row name="gender" value={registerData.gender} onChange={handleRegisterChange}>
                <FormControlLabel
                  value="male"
                  control={
                    <Radio
                      sx={{
                        color: "black",
                        "&.Mui-checked": { color: "#E56A16" },
                      }}
                    />
                  }
                  label="Male"
                  sx={{ color: "black" }}
                />
                <FormControlLabel
                  value="female"
                  control={
                    <Radio
                      sx={{
                        color: "black",
                        "&.Mui-checked": { color: "#E56A16" },
                      }}
                    />
                  }
                  label="Female"
                  sx={{ color: "black" }}
                />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  sx={{
                    color: "black",
                    "&.Mui-checked": { color: "#E56A16" },
                  }}
                />
              }
              // Label contains a link to the terms page
              label={
                <span className="text-black" >
                  I accept the{" "}
                  <Link href="/terms" style={{ color: "black", textDecoration: "underline" }}>
                    terms and conditions
                  </Link>
                </span>
              }
              sx={{ color: "#fff" }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={registerLoading}
              sx={{
                background: "linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);",
                color: "white",
                py: 1.5,
                // mb:2,
                fontSize: "1.1rem",
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);",
                },
                "&:disabled": {
                  background: "linear-gradient(177deg,rgba(229, 106, 22, 1) 26%, rgba(207, 35, 38, 1) 100%);",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
            >
              {registerLoading ? <CircularProgress size={24} color="inherit" /> : "Register"}
            </Button>
          </Stack>
        </Box>
      )}
    </>
  )
}

export default AuthTabs
