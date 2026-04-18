"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
  Dialog,
  DialogContent,
} from "@mui/material"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import toast from "react-hot-toast"
import { Visibility, VisibilityOff, Facebook, Apple, Close as CloseIcon } from "@mui/icons-material"
import Link from "next/link"
import { authStorage, type UserDataShape, type UserProfile } from "@/lib/authStorage"
import { buildSocialAuthUrl } from "@/lib/clientApiBase"
import type { User } from "@/types/user"
import { Country, State, City } from 'country-state-city'
import {
  formatPhoneDigitRule,
  getPhoneDigitRuleByIsoCode,
  isPhoneDigitsValidForRule,
  sanitizePhoneDigits,
} from "@/lib/phoneValidation"

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

const dropdownPaperBaseSx = {
  mt: 0,
  maxHeight: { xs: 240, sm: 300 },
  overflowY: "auto",
  overscrollBehavior: "contain" as const,
}

const dropdownMenuBaseProps = {
  anchorOrigin: { vertical: "bottom", horizontal: "left" } as const,
  transformOrigin: { vertical: "top", horizontal: "left" } as const,
  variant: "menu" as const,
  marginThreshold: 0,
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

  // Forgot password dialog state
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1) // 1=email, 2=otp, 3=new password, 4=success
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotOtp, setForgotOtp] = useState(["" , "", "", "", ""])
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("")
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDialogMessage, setForgotDialogMessage] = useState("")
  const [forgotDialogError, setForgotDialogError] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState("")
  const [forgotConfirmError, setForgotConfirmError] = useState("")

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")

  // Email verification dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState("")
  const [verifyOtp, setVerifyOtp] = useState(["", "", "", "", "", ""])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState("")
  const [verifyError, setVerifyError] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState(false)

  // Resend cooldown timers (60 seconds)
  const [forgotResendTimer, setForgotResendTimer] = useState(0)
  const [verifyResendTimer, setVerifyResendTimer] = useState(0)

  // Location selectors state (codes used to derive dependent lists)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")

  // Desktop: City/State dropdown (we map it to state/city strings for backend compatibility)
  const [selectedStateCode, setSelectedStateCode] = useState<string>("")

  // Phone country code selector (independent of profile country)
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>("AE")
  const [phoneError, setPhoneError] = useState("")

  const selectedPhoneRule = useMemo(
    () => getPhoneDigitRuleByIsoCode(phoneCountryCode),
    [phoneCountryCode]
  )
  const phoneDigitsLabel = formatPhoneDigitRule(selectedPhoneRule)
  const phoneRuleHint = `Required ${phoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`

  const getPhoneLengthError = (digits: string): string => {
    if (!digits) return ""
    if (isPhoneDigitsValidForRule(digits, selectedPhoneRule)) return ""
    return `Phone number must be ${phoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`
  }

  // Shared input styling for white bg + black text + visible placeholder
  const inputSx = {
    width: { xs: '100%', md: '220px' },
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      color: "#000",
      borderRadius: '7px',
      height: '40px',
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

  // Countdown timer for forgot-password resend button
  useEffect(() => {
    if (forgotResendTimer <= 0) return
    const id = setTimeout(() => setForgotResendTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [forgotResendTimer])

  // Countdown timer for verification resend button
  useEffect(() => {
    if (verifyResendTimer <= 0) return
    const id = setTimeout(() => setVerifyResendTimer(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [verifyResendTimer])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value })
  }

  const passwordPattern = /^(?=.*[a-zA-Z])(?=.*[0-9]).{7,}$/
  const PASSWORD_FORMAT_MSG = "Password must contain letters and numbers. Consider also using upper and lower case and other characters (-, _, @, ?, etc)"
  const getPasswordError = (pw: string): string => {
    if (!pw) return ""
    if (pw.length < 7) return "Password must be at least 7 characters"
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return PASSWORD_FORMAT_MSG
    return ""
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "phone") {
      const digits = sanitizePhoneDigits(value).slice(0, selectedPhoneRule.max)
      setRegisterData((prev) => ({ ...prev, phone: digits }))
      setPhoneError(getPhoneLengthError(digits))
      return
    }

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

  useEffect(() => {
    const digits = sanitizePhoneDigits(registerData.phone || "")
    const trimmed = digits.slice(0, selectedPhoneRule.max)

    if (trimmed !== registerData.phone) {
      setRegisterData((prev) => ({ ...prev, phone: trimmed }))
      return
    }

    if (!trimmed) {
      setPhoneError("")
      return
    }

    if (isPhoneDigitsValidForRule(trimmed, selectedPhoneRule)) {
      setPhoneError("")
      return
    }

    setPhoneError(`Phone number must be ${phoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`)
  }, [phoneCountryCode, registerData.phone, selectedPhoneRule, phoneDigitsLabel])

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
        // Check if account needs verification
        const errData = result as any
        if (errData.requiresVerification && errData.email) {
          setVerifyEmail(errData.email)
          setVerifyOtp(["", "", "", "", "", ""])
          setVerifyMessage("")
          setVerifyError(false)
          setVerifySuccess(false)
          setVerifyResendTimer(60)
          setVerifyDialogOpen(true)
          toast(errData.message || "Please verify your email to continue.")
          return
        }
        toast.error(extractApiMessage(result))
      }
    } catch (err: unknown) {
      console.error("[AuthTabs] Login submission error:", err)
      // Also check for verification requirement in error responses
      const errData = err as any
      if (errData?.requiresVerification && errData?.email) {
        setVerifyEmail(errData.email)
        setVerifyOtp(["", "", "", "", "", ""])
        setVerifyMessage("")
        setVerifyError(false)
        setVerifySuccess(false)
        setVerifyResendTimer(60)
        setVerifyDialogOpen(true)
        toast("Please verify your email to continue.")
        return
      }
      toast.error(extractApiMessage(err))
    } finally {
      setLoginLoading(false)
    }
  }

  const validateRegisterForm = () => {
    const age = Number.parseInt(registerData.age)
    const phoneDigits = sanitizePhoneDigits(registerData.phone || "")
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
    else if (registerData.firstName.length > 20) msg = "First name must be 20 characters or less"
    else if (registerData.lastName.length > 20) msg = "Last name must be 20 characters or less"
    else if (!passwordPattern.test(registerData.password)) {
      msg = PASSWORD_FORMAT_MSG
      setPasswordError(getPasswordError(registerData.password))
    }
    else if (registerData.password !== registerData.confirmPassword) {
      msg = "Passwords do not match"
      setConfirmError("Passwords do not match")
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) msg = "Invalid email"
    else if (!isPhoneDigitsValidForRule(phoneDigits, selectedPhoneRule)) {
      msg = `Phone number must be ${phoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`
      setPhoneError(msg)
    }
    else if (isNaN(age) || age < 18 || age > 65) msg = "Age must be between 18 and 65"
    else if (!acceptTerms) msg = "Please accept the terms"
    if (msg) {
      setRegisterError(msg)
      toast.error(msg)
      return false
    }
    setPhoneError("")
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

      // Check if server says verification is required (6-digit code flow)
      if (result.success && result.requiresVerification) {
        const emailForVerify = result.email || registerData.email
        setVerifyEmail(emailForVerify)
        setVerifyOtp(["", "", "", "", "", ""])
        setVerifyMessage("")
        setVerifyError(false)
        setVerifySuccess(false)
        setVerifyResendTimer(60)
        setVerifyDialogOpen(true)
        toast.success(result.message || "Registration successful! Check your email for verification code.")
        return
      }

      if (result.success && result.data) {
        if (result.token) {
          // Use the helper functions to normalize data
          const normalizedUser = normalizeUserForStorage(result.data)
          const userData = normalizeUserData(result.data)
          
          // Save auth data
          const saved = authStorage.saveAuthExact(normalizedUser, userData, result.token)
          console.log("[AuthTabs] Token saved:", saved)
          
          // Wait for cookies to be set properly
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Verify token was saved
          const token = Cookies.get('token')
          console.log("[AuthTabs] Token verification:", {
            hasCookie: !!token,
            tokenLength: token?.length
          })
        }
        toast.success(result.message || "Registration successful!")
        
        // Small delay before redirect to ensure cookies are set
        setTimeout(() => {
          window.location.href = "/home"
        }, 150)
      } else {
        // Check if the error response also has requiresVerification (e.g., from login attempt of unverified user)
        const errData = result as any
        if (errData.requiresVerification && errData.email) {
          setVerifyEmail(errData.email)
          setVerifyOtp(["", "", "", "", "", ""])
          setVerifyMessage("")
          setVerifyError(false)
          setVerifySuccess(false)
          setVerifyResendTimer(60)
          setVerifyDialogOpen(true)
          toast("Please verify your email to continue.")
          return
        }
        toast.error(extractApiMessage(result))
      }
    } catch (err: unknown) {
      console.error("[AuthTabs] Register submission error:", err)
      toast.error(extractApiMessage(err))
    } finally {
      setRegisterLoading(false)
    }
  }

  // Verification dialog handlers
  const handleVerifyOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^[0-9]$/.test(value)) return
    const newOtp = [...verifyOtp]
    newOtp[index] = value
    setVerifyOtp(newOtp)
    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`verify-otp-input-${index + 1}`)
      if (next) (next as HTMLInputElement).focus()
    }
  }

  const handleVerifyOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verifyOtp[index] && index > 0) {
      const prev = document.getElementById(`verify-otp-input-${index - 1}`)
      if (prev) (prev as HTMLInputElement).focus()
    }
  }

  const handleVerifyOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setVerifyOtp(pasted.split(""))
      const last = document.getElementById(`verify-otp-input-5`)
      if (last) (last as HTMLInputElement).focus()
    }
  }

  const handleVerifyRegistration = async () => {
    setVerifyMessage("")
    setVerifyError(false)
    const code = verifyOtp.join("")
    if (code.length < 6) {
      setVerifyMessage("Please enter the complete 6-digit code.")
      setVerifyError(true)
      return
    }
    setVerifyLoading(true)
    try {
      const res = await authAPI.verifyRegistration(verifyEmail, code)
      if (res.success && res.data) {
        setVerifySuccess(true)
        toast.success("Email verified successfully! Welcome to Champion Footballer!")

        if (res.token) {
          const normalizedUser = normalizeUserForStorage(res.data)
          const userData = normalizeUserData(res.data)
          authStorage.saveAuthExact(normalizedUser, userData, res.token)
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Redirect to home after a brief celebration
        setTimeout(() => {
          window.location.href = "/home"
        }, 1500)
      } else {
        setVerifyMessage(extractApiMessage(res))
        setVerifyError(true)
      }
    } catch (err) {
      setVerifyMessage(extractApiMessage(err))
      setVerifyError(true)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setVerifyMessage("")
    setVerifyError(false)
    setVerifyLoading(true)
    try {
      const res = await authAPI.resendVerification(verifyEmail)
      if (res.success) {
        setVerifyOtp(["", "", "", "", "", ""])
        setVerifyResendTimer(60)
        toast.success("New verification code sent to your email!")
        setVerifyMessage("New code sent! Check your email.")
        setVerifyError(false)
      } else {
        setVerifyMessage((res as any).error || "Failed to resend code.")
        setVerifyError(true)
      }
    } catch (err) {
      setVerifyMessage(extractApiMessage(err))
      setVerifyError(true)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    // Open the dialog instead of inline behavior
    setForgotDialogOpen(true)
    setForgotStep(1)
    setForgotEmail(loginData.email || "")
    setForgotOtp(["", "", "", "", ""])
    setForgotNewPassword("")
    setForgotConfirmPassword("")
    setForgotDialogMessage("")
    setForgotDialogError(false)
    setForgotPasswordError("")
    setForgotConfirmError("")
    setForgotLoading(false)
  }

  const handleForgotDialogClose = () => {
    setForgotDialogOpen(false)
    setForgotStep(1)
    setForgotDialogMessage("")
    setForgotDialogError(false)
    setForgotPasswordError("")
    setForgotConfirmError("")
    setForgotLoading(false)
  }

  // Step 1: Send OTP to email
  const handleSendOtp = async () => {
    setForgotDialogMessage("")
    setForgotDialogError(false)
    if (!forgotEmail) {
      setForgotDialogMessage("Please enter your email address.")
      setForgotDialogError(true)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail)) {
      setForgotDialogMessage("Please enter a valid email address.")
      setForgotDialogError(true)
      return
    }
    setForgotLoading(true)
    try {
      const res = await authAPI.resetPassword(forgotEmail)
      if (res.success) {
        setForgotStep(2)
        setForgotDialogMessage("")
        setForgotResendTimer(60)
        toast.success("Verification code sent to your email!")
      } else {
        setForgotDialogMessage(extractApiMessage(res))
        setForgotDialogError(true)
      }
    } catch (err) {
      setForgotDialogMessage(extractApiMessage(err))
      setForgotDialogError(true)
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle OTP input boxes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^[0-9]$/.test(value)) return
    const newOtp = [...forgotOtp]
    newOtp[index] = value
    setForgotOtp(newOtp)
    // Auto-focus next input
    if (value && index < 4) {
      const next = document.getElementById(`otp-input-${index + 1}`)
      if (next) (next as HTMLInputElement).focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !forgotOtp[index] && index > 0) {
      const prev = document.getElementById(`otp-input-${index - 1}`)
      if (prev) (prev as HTMLInputElement).focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5)
    if (pasted.length === 5) {
      setForgotOtp(pasted.split(""))
      const last = document.getElementById(`otp-input-4`)
      if (last) (last as HTMLInputElement).focus()
    }
  }

  // Step 2: Verify OTP only (then move to password step)
  const handleVerifyOtp = async () => {
    setForgotDialogMessage("")
    setForgotDialogError(false)
    const code = forgotOtp.join("")
    if (code.length < 5) {
      setForgotDialogMessage("Please enter the complete 5-digit code.")
      setForgotDialogError(true)
      return
    }
    setForgotLoading(true)
    try {
      const res = await authAPI.verifyOtp(forgotEmail, code)
      if (res.success) {
        setForgotStep(3)
        setForgotDialogMessage("")
        toast.success("Code verified!")
      } else {
        setForgotDialogMessage(res.error || "Invalid code.")
        setForgotDialogError(true)
      }
    } catch (err) {
      setForgotDialogMessage(extractApiMessage(err))
      setForgotDialogError(true)
    } finally {
      setForgotLoading(false)
    }
  }

  // Step 3: Set new password
  const handleVerifyAndReset = async () => {
    setForgotDialogMessage("")
    setForgotDialogError(false)
    const code = forgotOtp.join("")
    if (!forgotNewPassword) {
      setForgotDialogMessage("Please enter a new password.")
      setForgotDialogError(true)
      return
    }
    if (forgotNewPassword.length < 7) {
      setForgotDialogMessage("Password must be at least 7 characters with letters and numbers.")
      setForgotDialogError(true)
      return
    }
    if (!/[a-zA-Z]/.test(forgotNewPassword) || !/[0-9]/.test(forgotNewPassword)) {
      setForgotDialogMessage(PASSWORD_FORMAT_MSG)
      setForgotDialogError(true)
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotDialogMessage("Passwords do not match.")
      setForgotDialogError(true)
      return
    }
    setForgotLoading(true)
    try {
      const res = await authAPI.verifyResetCode(forgotEmail, code, forgotNewPassword)
      if (res.success) {
        setForgotStep(4)
        setForgotDialogMessage("")
        toast.success("Password reset successfully!")
      } else {
        setForgotDialogMessage(res.error || "Failed to reset password.")
        setForgotDialogError(true)
      }
    } catch (err) {
      setForgotDialogMessage(extractApiMessage(err))
      setForgotDialogError(true)
    } finally {
      setForgotLoading(false)
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

            <Box sx={{ display: "flex", justifyContent: "center", width: { xs: "100%", md: "220px" } }}>
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
                inputProps={{ maxLength: 20 }}
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
                inputProps={{ maxLength: 20 }}
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
                error={Boolean(phoneError)}
                helperText={phoneError || phoneRuleHint}
                FormHelperTextProps={{ sx: { color: phoneError ? '#d32f2f' : '#555', fontSize: '0.75rem' } }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: selectedPhoneRule.max }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ height: '100%' }}>
                      <Select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value as string)}
                        variant="standard"
                        disableUnderline
                        MenuProps={{
                          ...dropdownMenuBaseProps,
                          PaperProps: {
                            sx: {
                              ...dropdownPaperBaseSx,
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
                inputProps={{ minLength: 7 }}
                error={Boolean(passwordError)}
                helperText={passwordError || 'Min 7 characters with letters and numbers'}
                FormHelperTextProps={{ sx: { color: passwordError ? '#d32f2f' : '#555', fontSize: '0.75rem' } }}
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
                inputProps={{ minLength: 7 }}
                error={Boolean(confirmError)}
                helperText={confirmError || 'Re-type your password'}
                FormHelperTextProps={{ sx: { color: confirmError ? '#d32f2f' : '#555', fontSize: '0.75rem' } }}
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
                    MenuProps={{
                      ...dropdownMenuBaseProps,
                      PaperProps: { sx: dropdownPaperBaseSx },
                    }}
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
                  MenuProps={{
                    ...dropdownMenuBaseProps,
                    PaperProps: { sx: dropdownPaperBaseSx },
                  }}
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
                    MenuProps={{
                      ...dropdownMenuBaseProps,
                      PaperProps: { sx: dropdownPaperBaseSx },
                    }}
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
                  <span className="text-black" style={{ color: 'black' }}>
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
              const go = (provider: string) => {
                window.location.href = buildSocialAuthUrl(provider, '/home')
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

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotDialogOpen}
        onClose={handleForgotDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: '#101010',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        {/* Header with orange-red gradient */}
        <Box sx={{
          background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
          px: 3, pt: 3, pb: 3.5,
          position: 'relative',
          textAlign: 'center',
        }}>
          <IconButton
            onClick={handleForgotDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <CloseIcon />
          </IconButton>

          {/* Step indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            {[1, 2, 3, 4].map((s) => (
              <Box
                key={s}
                sx={{
                  width: forgotStep === s ? 24 : 8,
                  height: 8,
                  borderRadius: '4px',
                  bgcolor: forgotStep >= s ? '#fff' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>

          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif', mb: 0.5 }}>
            {forgotStep === 1 && 'Reset Password'}
            {forgotStep === 2 && 'Enter Verification Code'}
            {forgotStep === 3 && 'Create New Password'}
            {forgotStep === 4 && 'All Done!'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
            {forgotStep === 1 && 'Enter your email to get a verification code'}
            {forgotStep === 2 && 'Check your email for the 5-digit code'}
            {forgotStep === 3 && 'Choose a strong new password'}
            {forgotStep === 4 && 'Your password has been updated'}
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, pt: 3, pb: 4, bgcolor: '#101010' }}>
          {forgotDialogMessage && (
            <Alert
              severity={forgotDialogError ? 'error' : 'success'}
              sx={{
                mb: 2,
                borderRadius: '7px',
                bgcolor: forgotDialogError ? 'rgba(207,35,38,0.15)' : 'rgba(0,167,127,0.15)',
                color: forgotDialogError ? '#ff6b6b' : '#00c896',
                '& .MuiAlert-icon': { color: forgotDialogError ? '#ff6b6b' : '#00c896' },
              }}
            >
              {forgotDialogMessage}
            </Alert>
          )}

          {/* â”€â”€ Step 1: Email â”€â”€ */}
          {forgotStep === 1 && (
            <Box>
              <Typography sx={{ mb: 1, fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                placeholder="you@example.com"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1a1a1a',
                    borderRadius: '7px',
                    color: '#fff',
                    '& fieldset': { borderColor: '#404040' },
                    '&:hover fieldset': { borderColor: '#E56A16' },
                    '&.Mui-focused fieldset': { borderColor: '#E56A16', borderWidth: 2 },
                    '& input': { color: '#fff', fontSize: '0.95rem' },
                  },
                  '& input::placeholder': { color: '#757575', opacity: 1 },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                disabled={forgotLoading}
                onClick={handleSendOtp}
                sx={{
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  py: 1.4,
                  borderRadius: '7px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'Woodford Bourne Pro, Arial, sans-serif',
                  boxShadow: '0 4px 14px rgba(229,106,22,0.3)',
                  '&:hover': { background: 'linear-gradient(177deg, rgba(210,96,18,1) 26%, rgba(187,30,33,1) 100%)' },
                  '&:disabled': { background: 'linear-gradient(177deg, rgba(229,106,22,0.5) 26%, rgba(207,35,38,0.5) 100%)', color: 'rgba(255,255,255,0.5)' },
                }}
              >
                {forgotLoading ? <CircularProgress size={22} color="inherit" /> : 'Send Verification Code'}
              </Button>
            </Box>
          )}

          {/* â”€â”€ Step 2: OTP Only â”€â”€ */}
          {forgotStep === 2 && (
            <Box>
              <Typography sx={{ mb: 1.5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                We sent a 5-digit code to <span style={{ color: '#E56A16', fontWeight: 600 }}>{forgotEmail}</span>
              </Typography>

              {/* OTP boxes */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2, mb: 3 }}>
                {forgotOtp.map((digit, idx) => (
                  <TextField
                    key={idx}
                    id={`otp-input-${idx}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        padding: '12px 0',
                        color: '#E56A16',
                        fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif',
                      },
                    }}
                    sx={{
                      width: 54,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a1a1a',
                        borderRadius: '7px',
                        '& fieldset': { borderColor: '#404040' },
                        '&:hover fieldset': { borderColor: '#E56A16' },
                        '&.Mui-focused fieldset': { borderColor: '#E56A16', borderWidth: 2 },
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                disabled={forgotLoading}
                onClick={handleVerifyOtp}
                sx={{
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  py: 1.4,
                  borderRadius: '7px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'Woodford Bourne Pro, Arial, sans-serif',
                  boxShadow: '0 4px 14px rgba(229,106,22,0.3)',
                  '&:hover': { background: 'linear-gradient(177deg, rgba(210,96,18,1) 26%, rgba(187,30,33,1) 100%)' },
                  '&:disabled': { background: 'linear-gradient(177deg, rgba(229,106,22,0.5) 26%, rgba(207,35,38,0.5) 100%)', color: 'rgba(255,255,255,0.5)' },
                }}
              >
                {forgotLoading ? <CircularProgress size={22} color="inherit" /> : 'Verify Code'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={handleSendOtp}
                disabled={forgotLoading || forgotResendTimer > 0}
                sx={{ mt: 1.5, color: '#E56A16', textTransform: 'none', fontSize: '0.8rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif', '&:hover': { bgcolor: 'rgba(229,106,22,0.08)' }, '&:disabled': { color: 'rgba(229,106,22,0.4)' } }}
              >
                {forgotResendTimer > 0 ? `Resend code in ${forgotResendTimer}s` : "Didn't receive code? Resend"}
              </Button>
            </Box>
          )}

          {/* â”€â”€ Step 3: New Password â”€â”€ */}
          {forgotStep === 3 && (
            <Box>
              <Typography sx={{ mb: 1, fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                New Password
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter new password"
                type={showForgotNewPassword ? 'text' : 'password'}
                value={forgotNewPassword}
                onChange={(e) => {
                  const v = e.target.value
                  setForgotNewPassword(v)
                  setForgotPasswordError(getPasswordError(v))
                  if (forgotConfirmPassword && forgotConfirmPassword !== v) {
                    setForgotConfirmError("Passwords do not match")
                  } else {
                    setForgotConfirmError("")
                  }
                }}
                error={Boolean(forgotPasswordError)}
                helperText={forgotPasswordError || 'Min 7 characters with letters and numbers'}
                FormHelperTextProps={{ sx: { color: forgotPasswordError ? '#ff6b6b' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem' } }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1a1a1a',
                    borderRadius: '7px',
                    color: '#fff',
                    '& fieldset': { borderColor: '#404040' },
                    '&:hover fieldset': { borderColor: '#E56A16' },
                    '&.Mui-focused fieldset': { borderColor: '#E56A16', borderWidth: 2 },
                    '& input': { color: '#fff', fontSize: '0.95rem' },
                  },
                  '& input::placeholder': { color: '#757575', opacity: 1 },
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowForgotNewPassword(v => !v)} edge="end" size="small" sx={{ color: '#757575' }}>
                      {showForgotNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <Typography sx={{ mb: 1, fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                placeholder="Confirm new password"
                type={showForgotConfirmPassword ? 'text' : 'password'}
                value={forgotConfirmPassword}
                onChange={(e) => {
                  const v = e.target.value
                  setForgotConfirmPassword(v)
                  setForgotConfirmError(v && v !== forgotNewPassword ? "Passwords do not match" : "")
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndReset()}
                error={Boolean(forgotConfirmError)}
                helperText={forgotConfirmError || 'Re-type your password'}
                FormHelperTextProps={{ sx: { color: forgotConfirmError ? '#ff6b6b' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem' } }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1a1a1a',
                    borderRadius: '7px',
                    color: '#fff',
                    '& fieldset': { borderColor: '#404040' },
                    '&:hover fieldset': { borderColor: '#E56A16' },
                    '&.Mui-focused fieldset': { borderColor: '#E56A16', borderWidth: 2 },
                    '& input': { color: '#fff', fontSize: '0.95rem' },
                  },
                  '& input::placeholder': { color: '#757575', opacity: 1 },
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowForgotConfirmPassword(v => !v)} edge="end" size="small" sx={{ color: '#757575' }}>
                      {showForgotConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <Button
                fullWidth
                variant="contained"
                disabled={forgotLoading}
                onClick={handleVerifyAndReset}
                sx={{
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  py: 1.4,
                  borderRadius: '7px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'Woodford Bourne Pro, Arial, sans-serif',
                  boxShadow: '0 4px 14px rgba(229,106,22,0.3)',
                  '&:hover': { background: 'linear-gradient(177deg, rgba(210,96,18,1) 26%, rgba(187,30,33,1) 100%)' },
                  '&:disabled': { background: 'linear-gradient(177deg, rgba(229,106,22,0.5) 26%, rgba(207,35,38,0.5) 100%)', color: 'rgba(255,255,255,0.5)' },
                }}
              >
                {forgotLoading ? <CircularProgress size={22} color="inherit" /> : 'Set New Password'}
              </Button>
            </Box>
          )}

          {/* â”€â”€ Step 4: Success â”€â”€ */}
          {forgotStep === 4 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
                boxShadow: '0 4px 20px rgba(229,106,22,0.3)',
              }}>
                <Typography sx={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>âœ“</Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff', mb: 1, fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif' }}>
                Password Reset Successful
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 3, fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                You can now log in with your new password.
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={handleForgotDialogClose}
                sx={{
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  py: 1.4,
                  borderRadius: '7px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'Woodford Bourne Pro, Arial, sans-serif',
                  boxShadow: '0 4px 14px rgba(229,106,22,0.3)',
                  '&:hover': { background: 'linear-gradient(177deg, rgba(210,96,18,1) 26%, rgba(187,30,33,1) 100%)' },
                }}
              >
                Back to Login
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Verification Dialog (after registration) */}
      <Dialog
        open={verifyDialogOpen}
        onClose={() => {}} /* prevent closing by clicking outside */
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: '#101010',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        {/* Header with green gradient for success feel */}
        <Box sx={{
          background: verifySuccess
            ? 'linear-gradient(177deg, #16a34a 26%, #15803d 100%)'
            : 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
          px: 3, pt: 3, pb: 3.5,
          position: 'relative',
          textAlign: 'center',
        }}>
          <IconButton
            onClick={() => setVerifyDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <CloseIcon />
          </IconButton>

          {verifySuccess ? (
            <>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <Typography sx={{ color: '#fff', fontSize: '2rem', fontWeight: 700 }}>âœ“</Typography>
              </Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif', mb: 0.5 }}>
                Welcome to CF!
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                Your account has been verified. Redirecting...
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif', mb: 0.5 }}>
                Registration Successful! 
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif', mb: 1 }}>
                Welcome to CF.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif', lineHeight: 1.5 }}>
                Head over to your email and enter the 6-digit verification key to complete your sign-up and start playing
              </Typography>
            </>
          )}
        </Box>

        <DialogContent sx={{ px: 3, pt: 3, pb: 4, bgcolor: '#101010' }}>
          {verifyMessage && (
            <Alert
              severity={verifyError ? 'error' : 'success'}
              sx={{
                mb: 2,
                borderRadius: '7px',
                bgcolor: verifyError ? 'rgba(207,35,38,0.15)' : 'rgba(0,167,127,0.15)',
                color: verifyError ? '#ff6b6b' : '#00c896',
                '& .MuiAlert-icon': { color: verifyError ? '#ff6b6b' : '#00c896' },
              }}
            >
              {verifyMessage}
            </Alert>
          )}

          {!verifySuccess && (
            <Box>
              <Typography sx={{ mb: 1.5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif' }}>
                We sent a 6-digit code to <span style={{ color: '#E56A16', fontWeight: 600 }}>{verifyEmail}</span>
              </Typography>

              {/* 6-digit OTP boxes */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                {verifyOtp.map((digit, idx) => (
                  <TextField
                    key={idx}
                    id={`verify-otp-input-${idx}`}
                    value={digit}
                    onChange={(e) => handleVerifyOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleVerifyOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleVerifyOtpPaste : undefined}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        padding: '12px 0',
                        color: '#E56A16',
                        fontFamily: 'Woodford Bourne Pro, Arial Black, sans-serif',
                      },
                    }}
                    sx={{
                      width: 48,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a1a1a',
                        borderRadius: '7px',
                        '& fieldset': { borderColor: '#404040' },
                        '&:hover fieldset': { borderColor: '#E56A16' },
                        '&.Mui-focused fieldset': { borderColor: '#E56A16', borderWidth: 2 },
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                disabled={verifyLoading}
                onClick={handleVerifyRegistration}
                sx={{
                  background: 'linear-gradient(177deg, rgba(229,106,22,1) 26%, rgba(207,35,38,1) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  py: 1.4,
                  borderRadius: '7px',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'Woodford Bourne Pro, Arial, sans-serif',
                  boxShadow: '0 4px 14px rgba(229,106,22,0.3)',
                  '&:hover': { background: 'linear-gradient(177deg, rgba(210,96,18,1) 26%, rgba(187,30,33,1) 100%)' },
                  '&:disabled': { background: 'linear-gradient(177deg, rgba(229,106,22,0.5) 26%, rgba(207,35,38,0.5) 100%)', color: 'rgba(255,255,255,0.5)' },
                }}
              >
                {verifyLoading ? <CircularProgress size={22} color="inherit" /> : 'Verify & Start Playing'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={handleResendVerification}
                disabled={verifyLoading || verifyResendTimer > 0}
                sx={{ mt: 1.5, color: '#E56A16', textTransform: 'none', fontSize: '0.8rem', fontFamily: 'Inter, Woodford Bourne Pro, sans-serif', '&:hover': { bgcolor: 'rgba(229,106,22,0.08)' }, '&:disabled': { color: 'rgba(229,106,22,0.4)' } }}
              >
                {verifyResendTimer > 0 ? `Resend code in ${verifyResendTimer}s` : "Didn't receive code? Resend"}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AuthTabs
