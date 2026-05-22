"use client"
import { useAuth } from "@/lib/hooks"
import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Person, Sports, AccountCircle } from "@mui/icons-material"
import { Visibility, VisibilityOff, ArrowBack, ArrowForward } from "@mui/icons-material"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Slider,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Container,
  Fade,
  Modal,
  MenuItem,
  Select,
  InputAdornment,
} from "@mui/material"
import { Country, State } from "country-state-city"
import { styled } from "@mui/material/styles"
import { updateProfile, deleteProfile, deleteProfilePicture } from "@/lib/api"
import { cacheManager } from "@/lib/cacheManager"
import { useRouter } from "next/navigation"
import toast, { Toaster } from 'react-hot-toast';
import {
  formatPhoneDigitRule,
  getPhoneDigitRuleByIsoCode,
  isPhoneDigitsValidForRule,
  sanitizePhoneDigits,
} from "@/lib/phoneValidation"
import Dribbling from '@/Components/images/Dribbling.png'
import Pace from '@/Components/images/pace.png'
import Physical from '@/Components/images/physical.png'
import Passing from '@/Components/images/passing.png'
import Shooting from '@/Components/images/shooting.png'
import Defending from '@/Components/images/defending.png'
import Image from "next/image"
import { useDispatch } from "react-redux"
import { mergeUser, syncWithStorage } from "@/lib/features/authSlice"
import ProfileSettingsLoadingSkeleton from "@/Components/loading/ProfileSettingsLoadingSkeleton"
import { getAvatarBackgroundColor, getAvatarInitials } from "@/lib/avatarInitials"

// Country/State dropdowns are powered by country-state-city for parity with join/register flow.


// ===== THEME (brand palette reused) =====
const themeColors = {
  primary: "#00a77f",
  primaryAlt: "#00a77f",
  primaryGradient: "linear-gradient(135deg,#00a77f 0%,#00a77f 100%)",
  primarySoft: "linear-gradient(135deg,rgba(0,167,127,0.25) 0%, rgba(0,167,127,0.25) 100%)",
  surface: "#141416",
  surfaceAlt: "#1d1e21",
  surfaceElevated: "linear-gradient(140deg,#1e1f22 0%,#26272b 100%)",
  border: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.22)",
  text: "#ffffff",
  textDim: "rgba(255,255,255,0.72)",
  textFaint: "rgba(255,255,255,0.5)",
  success: "#10b981",
  danger: "#d32f2f",
  warn: "#ffb300",
  sliderTrack: "linear-gradient(90deg,#00a77f,#00a77f)"
}

const selectMenuProps = {
  anchorOrigin: { vertical: "bottom", horizontal: "left" } as const,
  transformOrigin: { vertical: "top", horizontal: "left" } as const,
  variant: "menu" as const,
  marginThreshold: 0,
  PaperProps: {
    sx: {
      mt: 0,
      maxHeight: { xs: 240, sm: 320 },
      overflowY: "auto",
      overscrollBehavior: "contain",
      bgcolor: themeColors.surfaceAlt,
      color: themeColors.text,
      border: `1px solid ${themeColors.border}`,
    },
  },
}

// ===== Styled Components (re-skinned) =====
const StyledPaper = styled(Paper)(() => ({
  background: themeColors.surfaceElevated,
  borderRadius: 20,
  boxShadow: "0 10px 34px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
  border: `1px solid ${themeColors.border}`,
  backdropFilter: "blur(8px)",
  position: "relative",
  overflow: "hidden"
}))

const SkillCard = styled(Card)(() => ({
  background: "#171717",
  borderRadius: 16,
  color: themeColors.text,
  position: "relative",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 6px 22px -6px rgba(0,0,0,0.65)",
  transition: "transform .35s, box-shadow .35s, border-color .35s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 14px 38px -8px rgba(0,0,0,0.75)",
    borderColor: "rgba(255,255,255,0.7)"
  }
}))

const StyledSlider = styled(Slider)(() => ({
  height: 8,
  padding: '4px 0',                 // reduce default vertical padding
  boxSizing: 'border-box',
  '& .MuiSlider-track': {
    border: 'none',
    background: themeColors.sliderTrack
  },
  '& .MuiSlider-rail': {
    opacity: 0.25,
    background: '#555'
  },
  '& .MuiSlider-thumb': {
    width: 20,
    height: 20,
    background: '#fff',
    border: `3px solid ${themeColors.primary}`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
    '&:hover': { boxShadow: '0 0 0 6px rgba(0,167,127,0.25)' },
    '&:focus-visible': { boxShadow: '0 0 0 8px rgba(0,167,127,0.30)' }
  }
}))

const StyledTextField = styled(TextField)(() => ({
  maxWidth: "100%",
  width: "100%",
  '& .MuiOutlinedInput-root': {
    background: "#171717",
    color: themeColors.text,
    borderRadius: 6,
    border: `1px solid rgba(255,255,255,0.5)`,
    transition: ".25s",
    '& fieldset': { borderColor: "transparent" },
    '&:hover': { borderColor: themeColors.borderStrong },
    '&:hover fieldset': { borderColor: themeColors.primary },
    '&.Mui-focused': { borderColor: themeColors.primary },
    '&.Mui-focused fieldset': { borderColor: themeColors.primary },
    '& input, & textarea': {
      color: themeColors.text,
      background: "transparent"
    },
    // Reduced overall control height
    minHeight: 44
  },
  // Compact input padding + font size
  '& .MuiOutlinedInput-input': {
    padding: '6px 12px',      // was larger before
    fontSize: '0.85rem',
    lineHeight: 1.2
  },
  '& .MuiInputLabel-root': { color: themeColors.textDim },
  '& .MuiInputLabel-root.Mui-focused': { color: themeColors.primary },
  '& .MuiFormHelperText-root': { color: '#fff !important' },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
    WebkitBoxShadow: '0 0 0 1000px #171717 inset !important',
    boxShadow: '0 0 0 1000px #171717 inset !important',
    WebkitTextFillColor: themeColors.text,
    caretColor: themeColors.text,
    transition: 'background-color 9999s ease-out 0s',
    backgroundClip: 'content-box !important'
  }
}))

const StyledRadio = styled(Radio)(() => ({
  color: themeColors.primary,
  '&.Mui-checked': {
    color: themeColors.primaryAlt
  }
}))

const StyledFormLabel = styled(FormLabel)(() => ({
  color: themeColors.text,
  fontWeight: 700,
  letterSpacing: .5
}))

// Utility coloring from skill value -> gradient stop
const getSkillLabel = (value: number) => {
  if (value >= 90) return { text: `${value} Elite`, color: "linear-gradient(90deg,#b85214,#b85214)" }
  if (value >= 80) return { text: `${value} Pro`, color: "linear-gradient(90deg,#e16419,#e16419)" }
  if (value >= 70) return { text: `${value} Advanced`, color: "linear-gradient(90deg,#ff9861,#ff9861)" }
  return { text: `${value} Developing`, color: "linear-gradient(90deg,#00a77f,#00a77f)" }
}
// const getSkillColor = (value: number) => {
//   if (value >= 80) return themeColors.primary
//   if (value >= 70) return themeColors.primaryAlt
//   return "#666"

// // COMPONENT
// }

// Safely extract an error message
const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error && e.message) return e.message
  if (typeof e === 'string') return e
  if (typeof (e as { message?: unknown })?.message === 'string') return (e as { message: string }).message
  return "Failed to update profile. Please try again."
}

const buildPlayerDisplayName = (firstName?: string | null, lastName?: string | null): string => {
  const first = typeof firstName === "string" ? firstName.trim() : ""
  const last = typeof lastName === "string" ? lastName.trim() : ""
  const lastInitial = last ? `${last.charAt(0).toUpperCase()}.` : ""

  if (first) return lastInitial ? `${first} ${lastInitial}` : first
  if (lastInitial) return lastInitial
  return "Player Name"
}

const getCountryFlagUrl = (isoCode: string): string => {
  const code = String(isoCode || "").toLowerCase()
  if (!/^[a-z]{2}$/.test(code)) return ""
  return `https://flagcdn.com/24x18/${code}.png`
}

const normalizeLocationName = (name: string): string => {
  return String(name || "")
    .replace(/^City and County of\s+/i, "")
    .replace(/^City of\s+/i, "")
    .replace(/^County of\s+/i, "")
    .trim()
}

// Shape of possible API error objects (optional)
// interface ApiError {
//   message?: string
//   status?: number
//   [key: string]: unknown
// }

const PlayerProfileCard = () => {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [dribbling, setDribbling] = useState(user?.skills?.dribbling)
  const [shooting, setShooting] = useState(user?.skills?.shooting)
  const [passing, setPassing] = useState(user?.skills?.passing)
  const [pace, setPace] = useState(user?.skills?.pace)
  const [defending, setDefending] = useState(user?.skills?.defending)
  const [physical, setPhysical] = useState(user?.skills?.physical)
  const [isUpdating, setIsUpdating] = useState(false)
  const [, setError] = useState<string>("")
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [age, setAge] = useState(user?.age || "")
  const [gender, setGender] = useState(user?.gender || "")
  const [positionType, setPositionType] = useState(user?.positionType || "")
  const [position, setPosition] = useState(user?.position || "")
  const [style, setStyle] = useState(user?.style || "")
  const [preferredFoot, setPreferredFoot] = useState(user?.preferredFoot || "")
  // const [shirtNumber, ] = useState(user?.shirtNumber || "00")
  // setShirtNumber
  const [country, setCountry] = useState(user?.country || "")
  const [stateProvince, setStateProvince] = useState(user?.state || "")
  const [city, setCity] = useState(user?.city || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const phoneCountries = useMemo(() => Country.getAllCountries(), [])
  const profileCountries = useMemo(() => Country.getAllCountries(), [])
  const selectedProfileCountryCode = useMemo(() => {
    const normalizedCountry = String(country || "").trim().toLowerCase()
    if (!normalizedCountry) return ""
    const matched = profileCountries.find(
      (c) => String(c.name || "").trim().toLowerCase() === normalizedCountry
    )
    return matched?.isoCode || ""
  }, [country, profileCountries])
  const profileStates = useMemo(
    () => (selectedProfileCountryCode ? State.getStatesOfCountry(selectedProfileCountryCode) : []),
    [selectedProfileCountryCode]
  )
  const phoneCountryStorageKey = useMemo(
    () => `profilePhoneCountryCode:${String(user?.id || "me")}`,
    [user?.id]
  )
  const avatarUrlStorageKey = useMemo(() => {
    const id = String(user?.id || "").trim()
    return id ? `avatar_url:${id}` : null
  }, [user?.id])
  const avatarVersionStorageKey = useMemo(() => {
    const id = String(user?.id || "").trim()
    return id ? `avatar_v:${id}` : null
  }, [user?.id])
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>(() => {
    const fromUser = String((user as { phoneCountryCode?: string | null } | null)?.phoneCountryCode || "").trim().toUpperCase()
    if (/^[A-Z]{2}$/.test(fromUser)) return fromUser

    if (typeof window !== "undefined") {
      const fromScopedStorage = String(localStorage.getItem(`profilePhoneCountryCode:${String(user?.id || "me")}`) || "").trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(fromScopedStorage)) return fromScopedStorage

      const fromLegacyStorage = String(localStorage.getItem("profilePhoneCountryCode") || "").trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(fromLegacyStorage)) return fromLegacyStorage
    }

    const normalizedCountry = String(user?.country || "").trim().toLowerCase()
    if (!normalizedCountry) return "GB"
    const matchedCountry = phoneCountries.find(
      (c) => String(c.name || "").trim().toLowerCase() === normalizedCountry
    )
    return matchedCountry?.isoCode || "GB"
  })
  const [phoneError, setPhoneError] = useState("")
  // When editing location we mirror the City/State value into both city and stateProvince for backward compatibility.
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Password validation pattern: 6-16 chars, 1 uppercase, 1 number, 1 special char
  const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,16}$/
  const getPasswordError = (pw: string): string => {
    if (!pw) return "" // Empty is OK (means no change)
    if (pw.length < 6) return "Minimum 6 characters required"
    if (pw.length > 16) return "Maximum 16 characters allowed"
    if (!/[A-Z]/.test(pw)) return "Please ensure the password includes at least one uppercase letter."
    if (!/[0-9]/.test(pw)) return "Include at least one number"
    if (!/[^A-Za-z0-9]/.test(pw)) return "Include at least one special character"
    return ""
  }
  const [, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const safeSrc = (v: unknown) => (typeof v === "string" && v.trim().length ? v : "")
  const [imgSrc, setImgSrc] = useState<string>(safeSrc(user?.profilePicture))
  // For avatar options and camera
  const [avatarOptionsOpen, setAvatarOptionsOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const steps = ["Profile Overview", "Skills & Attributes", "Brief Details"]
  const activeWizardStep = step === 1 ? 0 : step === 3 ? 1 : 2
  const userDisplayName = buildPlayerDisplayName(user?.firstName, user?.lastName)
  const avatarInitials = getAvatarInitials({ name: userDisplayName, firstName, lastName })
  const avatarFallbackBg = getAvatarBackgroundColor(userDisplayName || `${firstName} ${lastName}`)

  // Playing styles per position type (3 options each; you can edit/rename later)
  const playingStylesMap: Record<"Goalkeeper" | "Defender" | "Midfielder" | "Forward", string[]> = {
    Goalkeeper: ["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Spider" ,"Sweeper Keeper"],
    Defender: ["Hacker", "No-Bull", "Shield" , "Terminator" , "Wall" , "Warrior"],
    Midfielder: ["Gladiator", "Maestro", "Magician" , "Powerhouse" , "Roadrunner" , "Scientist"],
    Forward: ["Finisher", "Poacher", "Predator" , "Rocket" ,"Ruthless" , "Sniper"],
  }
  const positionOptionsMap: Record<"Goalkeeper" | "Defender" | "Midfielder" | "Forward", string[]> = {
    Goalkeeper: ["Goalkeeper (GK)"],
    Defender: ["Center-Back (CB)", "Right-Back (RB)", "Left-Back (LB)", "Right Wing-back (RWB)", "Left Wing-back (LWB)"],
    Midfielder: ["Central Midfielder (CM)", "Defensive Midfielder (CDM)", "Attacking Midfielder (CAM)", "Right Midfielder (RM)", "Left Midfielder (LM)"],
    Forward: ["Striker (ST)", "Central Forward (CF)", "Right Forward (RF)", "Left Forward (LF)", "Right Winger (RW)", "Left Winger (LW)"],
  }
  const specificPositionRowHeight = 42
  const specificPositionRowsTarget = 6

  const resolvedPositionType: "Goalkeeper" | "Defender" | "Midfielder" | "Forward" | "" =
    (positionType === "Goalkeeper" || positionType === "Defender" || positionType === "Midfielder" || positionType === "Forward")
      ? positionType
      : ""

  const currentStyleOptions = resolvedPositionType ? playingStylesMap[resolvedPositionType] : []
  const currentPositionOptions = resolvedPositionType ? positionOptionsMap[resolvedPositionType] : []
  const useExpandedPositionSpacing = currentPositionOptions.length === 5

  const selectedPhoneRule = useMemo(
    () => getPhoneDigitRuleByIsoCode(phoneCountryCode),
    [phoneCountryCode]
  )
  const selectedPhoneDigitsLabel = formatPhoneDigitRule(selectedPhoneRule)
  const selectedPhoneHint = `Required ${selectedPhoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}. Do not start with 0.`

  useEffect(() => { setImgSrc(safeSrc(user?.profilePicture)) }, [user?.profilePicture])

  useEffect(() => {
    const fromUser = String((user as { phoneCountryCode?: string | null } | null)?.phoneCountryCode || "").trim().toUpperCase()
    if (/^[A-Z]{2}$/.test(fromUser)) {
      setPhoneCountryCode((prev) => (prev === fromUser ? prev : fromUser))
      return
    }

    if (typeof window !== "undefined") {
      const fromScopedStorage = String(localStorage.getItem(phoneCountryStorageKey) || "").trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(fromScopedStorage)) {
        setPhoneCountryCode((prev) => (prev === fromScopedStorage ? prev : fromScopedStorage))
      }
    }
  }, [user, phoneCountryStorageKey])

  useEffect(() => {
    if (typeof window === "undefined") return
    const normalizedCode = String(phoneCountryCode || "").trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(normalizedCode)) return
    localStorage.setItem(phoneCountryStorageKey, normalizedCode)
    // Backward-compatible/global fallback key
    localStorage.setItem("profilePhoneCountryCode", normalizedCode)
  }, [phoneCountryCode, phoneCountryStorageKey])

  useEffect(() => {
    if (user?.position) {
      const p = user.position
      if (p.includes("Goalkeeper")) { setPositionType("Goalkeeper"); setPosition(p) }
      else if (p.includes("Back") || p.includes("Wing-back")) { setPositionType("Defender"); setPosition(p) }
      else if (p.includes("Midfielder")) { setPositionType("Midfielder"); setPosition(p) }
      else if (p.includes("Forward") || p.includes("Striker") || p.includes("Winger")) { setPositionType("Forward"); setPosition(p) }
      else { setPositionType(""); setPosition("") }
    } else {
      setPositionType("")
      setPosition("")
    }
  }, [user?.position])

  useEffect(() => {
    const digits = sanitizePhoneDigits(phone)
    const trimmed = digits.slice(0, selectedPhoneRule.max)
    if (trimmed !== phone) {
      setPhone(trimmed)
      return
    }

    if (!trimmed) {
      setPhoneError("")
      return
    }

    if (trimmed.startsWith("0")) {
      setPhoneError(
        `Please Insert The Phone Number Without 0 for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`
      )
      return
    }

    if (isPhoneDigitsValidForRule(trimmed, selectedPhoneRule)) {
      setPhoneError("")
      return
    }

    setPhoneError(
      `Phone number must be ${selectedPhoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`
    )
  }, [
    phone,
    phoneCountryCode,
    selectedPhoneRule,
    selectedPhoneDigitsLabel,
  ])

  if (authLoading) {
    return <ProfileSettingsLoadingSkeleton />;
  }

  // Note: Do not auto-change playing style on position type change.
  // We keep whatever is in DB/user selection; RadioGroup will show none selected
  // if the current style isn't in the options for the chosen position type.

  // Required UX order: Profile Overview -> Skills & Attributes -> Brief Details
  const handleNext = () => {
    setStep((s) => {
      if (s === 1) return 3
      if (s === 3) return 2
      return 2
    })
  }

  const handlePrevious = () => {
    setStep((s) => {
      if (s === 2) return 3
      if (s === 3) return 1
      return 1
    })
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordError(getPasswordError(value))
  }

  const handleUpdateProfile = async (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    try {
      setIsUpdating(true)
      setError("")
      if (!isAuthenticated || !token) throw new Error("Not authenticated. Please login again.")

      // Validate password if entered
      if (password && !passwordPattern.test(password)) {
        const errMsg = getPasswordError(password)
        setPasswordError(errMsg)
        toast.error(errMsg || "Password does not meet requirements")
        setIsUpdating(false)
        return
      }

      // Validate name length
      if (firstName.trim().length > 20) {
        toast.error("First name must be 20 characters or less")
        setIsUpdating(false)
        return
      }
      if (lastName.trim().length > 20) {
        toast.error("Last name must be 20 characters or less")
        setIsUpdating(false)
        return
      }
      if (email.trim().length > 40) {
        toast.error("Email must be 40 characters or less")
        setIsUpdating(false)
        return
      }

      // Helper to treat undefined/null/empty-string as blank
      const isBlank = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')

      // Build payload by including only modified/changed fields compared to current user
      const updateData: Record<string, unknown> = {}

      if (!isBlank(firstName) && firstName.trim() !== (user?.firstName || "").trim()) {
        updateData.firstName = firstName.trim()
      }
      if (!isBlank(lastName) && lastName.trim() !== (user?.lastName || "").trim()) {
        updateData.lastName = lastName.trim()
      }
      if (!isBlank(email) && email.trim() !== (user?.email || "").trim()) {
        updateData.email = email.trim()
      }

      if (!isBlank(age)) {
        const parsedAge = Number(String(age).trim())
        if (!Number.isNaN(parsedAge) && parsedAge !== Number(user?.age)) {
          updateData.age = parsedAge
        }
      }

      if (!isBlank(gender) && gender !== (user?.gender || "")) {
        updateData.gender = gender
      }

      // Core football fields (radio groups are never blank in UI, but keep guard anyway)
      if (!isBlank(position) && position !== (user?.position || "")) {
        updateData.position = position
      }
      if (!isBlank(positionType) && positionType !== (user?.positionType || "")) {
        updateData.positionType = positionType
      }
      if (!isBlank(style) && style !== (user?.style || "")) {
        updateData.style = style
      }
      if (!isBlank(preferredFoot) && preferredFoot !== (user?.preferredFoot || "")) {
        updateData.preferredFoot = preferredFoot
      }

      // Shirt number is hidden in UI; do not update it to avoid accidental overwrites
      // if (!isBlank(shirtNumber)) updateData.shirtNumber = String(shirtNumber).trim()

      // Location: only include if selected (avoid writing empty to DB)
      if (!isBlank(country) && country !== (user?.country || "")) {
        updateData.country = country
      }
      if (!isBlank(stateProvince) && stateProvince !== (user?.state || "")) {
        updateData.state = stateProvince
      }
      if (!isBlank(city) && city !== (user?.city || "")) {
        updateData.city = city
      }
      if (!isBlank(phone)) {
        const phoneDigits = sanitizePhoneDigits(phone).slice(0, selectedPhoneRule.max)
        const currentPhoneDigits = sanitizePhoneDigits(user?.phone || "")
        if (phoneDigits !== currentPhoneDigits) {
          if (phoneDigits.startsWith("0")) {
            const msg = `Please Insert The Phone Number Without 0 for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`
            setPhoneError(msg)
            toast.error(msg)
            setIsUpdating(false)
            return
          }
          if (!isPhoneDigitsValidForRule(phoneDigits, selectedPhoneRule)) {
            const msg = `Phone number must be ${selectedPhoneDigitsLabel} digits for ${phoneCountryCode}${selectedPhoneRule.dialCode ? ` (${selectedPhoneRule.dialCode})` : ""}`
            setPhoneError(msg)
            toast.error(msg)
            setIsUpdating(false)
            return
          }
          updateData.phone = phoneDigits
        }
      }
      const normalizedPhoneCountryCode = String(phoneCountryCode || "").trim().toUpperCase()
      const userPhoneCountryCode = String(user?.phoneCountryCode || "").trim().toUpperCase()
      if (/^[A-Z]{2}$/.test(normalizedPhoneCountryCode) && normalizedPhoneCountryCode !== userPhoneCountryCode) {
        updateData.phoneCountryCode = normalizedPhoneCountryCode
      }

      // Skills: include only changed skills
      const skillsUpdate: Record<string, number> = {}
      if (typeof dribbling === 'number' && dribbling !== user?.skills?.dribbling) skillsUpdate.dribbling = dribbling
      if (typeof shooting === 'number' && shooting !== user?.skills?.shooting) skillsUpdate.shooting = shooting
      if (typeof passing === 'number' && passing !== user?.skills?.passing) skillsUpdate.passing = passing
      if (typeof pace === 'number' && pace !== user?.skills?.pace) skillsUpdate.pace = pace
      if (typeof defending === 'number' && defending !== user?.skills?.defending) skillsUpdate.defending = defending
      if (typeof physical === 'number' && physical !== user?.skills?.physical) skillsUpdate.physical = physical
      if (Object.keys(skillsUpdate).length > 0) {
        updateData.skills = skillsUpdate
      }

      // Password: only if user actually entered something non-blank
      if (!isBlank(password)) {
        updateData.password = password
      }

      if (Object.keys(updateData).length === 0) {
        toast.success("Profile is already up to date!")
        router.push("/home")
        setIsUpdating(false)
        return
      }

      const { ok, data } = await updateProfile(token, updateData)
      if (!ok) throw new Error(data.message || "Failed to update profile")

      if (data.user) {
        // 1) Hot-merge user to Redux
        dispatch(mergeUser({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          age: typeof data.user.age === "string" ? Number(data.user.age) || undefined : data.user.age,
          gender: data.user.gender,
          position: data.user.position,
          positionType: data.user.positionType,
          style: data.user.style,
          preferredFoot: data.user.preferredFoot,
          shirtNumber: typeof data.user.shirtNumber === "string" ? Number(data.user.shirtNumber) || undefined : data.user.shirtNumber,
          country: data.user.country,
          phoneCountryCode: (data.user.phoneCountryCode || phoneCountryCode || null),
          state: data.user.state,
          city: data.user.city,
          phone: data.user.phone || null,
          profilePicture: data.user.profilePicture || null,
          image: data.user.profilePicture || null,
          skills: data.user.skills,
          id: data.user.id,
        }))
        // 2) Persist quickly
        dispatch(syncWithStorage())
        // 3) Update any other caches you keep
        cacheManager.updatePlayersCache(data.user)
      }

      const hasPasswordChange = !isBlank(password);
      const hasProfileChange = Object.keys(updateData).some(key => key !== 'password');

      if (hasProfileChange) {
        toast.success("Profile updated successfully!")
      }
      if (hasPasswordChange) {
        setPassword("")
        setPasswordError("")
        toast.success("Password changed successfully!", { duration: 4000 })
      }
      // Optional: refresh app router cache for any server components
      // router.refresh?.()
      router.push("/home")
    } catch (err: unknown) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!token) return
    if (!window.confirm("Delete account permanently? This cannot be undo.")) return
    try {
      setIsUpdating(true)
      const ok = await deleteProfile(token)
      if (ok) {
        // Clear application caches managed by CacheManager
        try { cacheManager.clearAllCaches() } catch {}

        // Clear any remaining local/session storage
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch {}

        // Proactively clear auth cookies
        try {
          document.cookie = "token=; Max-Age=0; path=/; SameSite=Lax"
          document.cookie = "auth_token=; Max-Age=0; path=/; SameSite=Lax"
        } catch {}

        toast.success("Account deleted successfully")
        // Hard redirect to main page to ensure a fully clean state
        window.location.href = "/"
      } else {
        toast.error("Failed to delete account.")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to delete account.")
    } finally {
      setIsUpdating(false)
    }
  }

  const performUpload = async (file: File) => {
    try {
      if (!token) throw new Error('Not authenticated')

      // Client-side validation
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`)
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`Invalid file type "${file.type}". Please upload an image file (JPEG, PNG, etc.).`)
        return
      }

      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setIsUpdating(true)
      const formData = new FormData()
      formData.append('profilePicture', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        cache: 'no-store',
      })
      let data
      try {
        data = await res.json()
      } catch {
        data = { message: 'Invalid server response' }
      }
      if (!res.ok) {
        const errMsg = data?.message || data?.error || `Upload failed (HTTP ${res.status})`
        toast.error(errMsg)
        setImagePreview(null)
        return
      }
      if (data.success) {
        const newUrl: string | undefined = data.user?.profilePicture
        if (data.user) cacheManager.updatePlayersCache(data.user)
        if (newUrl) {
          setImgSrc(newUrl)
          setImagePreview(null)
          dispatch(mergeUser({ profilePicture: newUrl, image: newUrl }))
          dispatch(syncWithStorage())
          if (avatarUrlStorageKey) localStorage.setItem(avatarUrlStorageKey, newUrl)
          if (avatarVersionStorageKey) localStorage.setItem(avatarVersionStorageKey, String(Date.now()))
          localStorage.removeItem('avatar_url')
          localStorage.removeItem('avatar_v')
        }
        toast.success('Profile picture updated!')
      } else {
        toast.error(data?.message || 'Upload failed')
        setImagePreview(null)
      }
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast.error(msg)
      setImagePreview(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarOptionsOpen(false)
      void performUpload(e.target.files[0])
    }
  }
  const openGalleryPicker = () => fileInputRef.current?.click()
  const handleAvatarClick = () => setAvatarOptionsOpen(true)

  const handleDeleteProfilePicture = async () => {
    try {
      if (!token) throw new Error('Not authenticated')
      setIsUpdating(true)
      const { ok, data } = await deleteProfilePicture(token)
      if (ok && data.success) {
        setImgSrc("")
        setImagePreview(null)
        dispatch(mergeUser({ profilePicture: null, image: null }))
        dispatch(syncWithStorage())
        if (avatarUrlStorageKey) localStorage.removeItem(avatarUrlStorageKey)
        if (avatarVersionStorageKey) localStorage.setItem(avatarVersionStorageKey, String(Date.now()))
        localStorage.removeItem('avatar_url')
        localStorage.removeItem('avatar_v')
        if (data.user) cacheManager.updatePlayersCache(data.user)
        toast.success('Profile picture removed')
      } else {
        toast.error(data?.message || 'Failed to remove profile picture')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove profile picture')
    } finally {
      setIsUpdating(false)
      setAvatarOptionsOpen(false)
    }
  }

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      setCameraOpen(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch (e) {
      console.error(e)
      toast.error('Camera is unavailable or permission denied.')
    }
  }
  const stopStream = () => {
    try { streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop()) } catch {}
    streamRef.current = null
  }
  const handleCloseCamera = () => { stopStream(); setCameraOpen(false) }
  const handleTakePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    const w = video.videoWidth || 720
    const h = video.videoHeight || 720
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' })
      // const blobUrl = URL.createObjectURL(blob)
      setAvatarOptionsOpen(false)
      handleCloseCamera()
      // Auto-upload captured photo
      void performUpload(file)
    }, 'image/jpeg', 0.92)
  }
  // const handleUploadImage = async () => {
  //   if (!imageFile || !token) return
  //   const formData = new FormData()
  //   formData.append("profilePicture", imageFile)
  //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${token}` },
  //     body: formData,
  //     cache: "no-store", // avoid stale response
  //   })
  //   const data = await res.json()
  //   if (data.success) {
  //     const newUrl: string | undefined = data.user?.profilePicture
  //     if (data.user) cacheManager.updatePlayersCache(data.user)

  //     if (newUrl) {
  //       // Update UI immediately
  //       setImgSrc(newUrl)
  //       setImagePreview(null)

  //       // Hot-merge into Redux user
  //       dispatch(mergeUser({ profilePicture: newUrl, image: newUrl }))
  //       dispatch(syncWithStorage())

  //       // Update PlayerCardâ€™s localStorage readers
  //       localStorage.setItem("avatar_url", newUrl)
  //       localStorage.setItem("avatar_v", String(Date.now()))
  //     }

  //     toast.success("Profile picture updated!")
  //     // No reload needed
  //   } else {
  //     toast.error("Upload failed")
  //   }
  // }

  // ---------- STEP 1 ----------
  if (step === 1) {
    return (
      <Container maxWidth={false} disableGutters sx={{
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        // background: "linear-gradient(177deg,rgba(0,167,127,0.15) 0%, rgba(0,167,127,0.15) 80%)",
        borderRadius: 4
      }}>
        <Fade in timeout={600}>
          <Box sx={{ width: '100%' }}>
            <StyledPaper sx={{
              p: { xs: 1.25, sm: 2 },
              borderRadius: { xs: 0, sm: 5 },
              width: '100%',
              maxWidth: { xs: '100%', sm: 650 },
              mx: { xs: 0, sm: 'auto' },
              background: "#1f1f1f",
              border: `1px solid ${themeColors.border}`,
            }}>
              <Stepper activeStep={activeWizardStep} sx={{
                mb: 3,
                maxWidth: 900,
                mx: 'auto',
                '& .MuiStepIcon-root.Mui-active': { color: '#00a77f' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00a77f' },
                '& .MuiStepConnector-line': { borderTopWidth: '1px' },
                '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } }
              }}>
                {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff !important', fontWeight: 600, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: '1rem', letterSpacing: .5, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff !important' }, '& .MuiStepLabel-label.Mui-completed': { color: '#fff !important' } }}>{label}</StepLabel></Step>)}
              </Stepper>
              <Box sx={{ width: '100%', height: 3, background: '#fff', mx: 0, mb: 3, opacity: 0.4 }} />

              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 1.5, width: '100%', height: { xs: 'auto', sm: 180 } }}>
                <Avatar
                  src={imgSrc || undefined}
                  alt="Profile"
                  imgProps={{
                    onError: () => setImgSrc(""),
                    referrerPolicy: 'no-referrer',
                    crossOrigin: 'anonymous'
                  }}
                  sx={{
                    width: { xs: 112, sm: 115 },
                    height: { xs: 152, sm: 160 },
                    border: `3px solid ${themeColors.primary}`,
                    borderRadius: 3,
                    background: imgSrc ? "#2f3033" : avatarFallbackBg,
                    color: '#fff',
                    fontSize: 44,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    boxShadow: "0 4px 18px -4px rgba(0,0,0,0.6)"
                  }}
                >
                  {!imgSrc ? avatarInitials : <Person sx={{ fontSize: 62, color: themeColors.textFaint }} />}
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', flex: 1, width: '100%' }}>
                  <Typography variant="h5" fontWeight={800} sx={{
                    color: themeColors.text,
                    lineHeight: 1.15,
                    textShadow: "0 2px 12px rgba(0,0,0,0.5)"
                  }}>
                    {userDisplayName}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim, mt: .5 }}>Age: <b style={{ color: themeColors.text }}>{user?.age || "-"}</b></Typography>
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim, display: 'flex', gap: .5, wordBreak: 'break-word', flexWrap: 'wrap' }}>
                    Email: <span style={{ color: themeColors.text }}>{user?.email || "email@example.com"}</span>
                  </Typography>
                  {/* Shirt number hidden per request */}
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim }}>Foot: <b style={{ color: themeColors.text }}>{user?.preferredFoot || "-"}</b></Typography>
                  {user?.phone && <Typography sx={{ fontSize: 13, color: themeColors.textDim }}>Phone: <b style={{ color: themeColors.text }}>{user.phone}</b></Typography>}
                  <Chip
                    label={positionType || "Position"}
                    size="small"
                    sx={{
                      mt: 'auto',
                      alignSelf: 'flex-start',
                      fontWeight: 700,
                      background: themeColors.primaryGradient,
                      color: '#fff',
                      letterSpacing: .4,
                      boxShadow: "0 4px 14px -4px rgba(0,0,0,0.6)"
                    }}
                  />
                </Box>
              </Box>

              <Card sx={{
                mt: 2.5,
                background: "linear-gradient(120deg,#222428 0%,#2b2d31 100%)",
                border: `1px solid ${themeColors.border}`,
                borderRadius: 4
              }}>
                <CardContent sx={{ pb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{
                    fontWeight: 700,
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: .6,
                    color: themeColors.text
                  }}>
                    Skills Overview
                  </Typography>
                  <Stack spacing={1.1}>
                    {[
                      { name: "Dribbling", value: dribbling },
                      { name: "Shooting", value: shooting },
                      { name: "Passing", value: passing },
                      { name: "Pace", value: pace },
                      { name: "Defending", value: defending },
                      { name: "Physical", value: physical },
                    ].map(skill => (
                      <Box key={skill.name}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: .4 }}>
                          <Typography sx={{ fontSize: 12, color: themeColors.textDim }}>{skill.name}</Typography>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: themeColors.text }}>{skill.value}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={skill.value}
                          sx={{
                            height: 6,
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.08)",
                            '& .MuiLinearProgress-bar': {
                              background: themeColors.primaryGradient
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'space-between', mt: 2.8 }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/home')}
                  startIcon={<ArrowBack />}
                  sx={{
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    px: 3,
                    width: { xs: '48%', sm: 220 },
                    height: 44,
                    borderRadius: 1,
                    boxShadow: "0 6px 16px -4px rgba(0,0,0,0.6)",
                    '&:hover': { opacity: .9 }
                  }}
                >
                  Home
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    px: 3,
                    width: { xs: '48%', sm: 220 },
                    height: 44,
                    borderRadius: 1,
                    boxShadow: "0 6px 16px -4px rgba(0,0,0,0.6)",
                    '&:hover': { opacity: .9 }
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </StyledPaper>
          </Box>
        </Fade>
      </Container>
    )
  }

  // ---------- STEP 2 ----------
  if (step === 2) {
    return (
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
          maxWidth: 1070,
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Fade in timeout={600}>
          <Box>
            <StyledPaper sx={{
              p: { xs: 1.25, sm: 1.5 },
              background: "#1f1f1f",
              borderRadius: 2
            }}>
              <Stepper activeStep={activeWizardStep} sx={{
                mb: 1.5,
                maxWidth: 700,
                mx: 'auto',
                '& .MuiStepIcon-root.Mui-active': { color: '#00a77f' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00a77f' },
                '& .MuiStepConnector-line': { borderTopWidth: '1px' },
                '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } }
              }}>
                {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff !important', fontWeight: 600, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: '1rem', letterSpacing: .5, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff !important' }, '& .MuiStepLabel-label.Mui-completed': { color: '#fff !important' } }}>{label}</StepLabel></Step>)}
              </Stepper>
              <Box sx={{ width: '100%', height: 2, background: '#fff', mx: 0, mb: 3, opacity: 0.80 }} />

              <Typography variant="h5" fontWeight={600} align="center" sx={{
                mb: 2,
                color: '#fff',
                letterSpacing: .5,
                fontFamily: 'var(--font-woodford-bourne-pro)',
                fontSize: { xs: '1.2rem', sm: '1.75rem' },
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}>
                <AccountCircle sx={{ mr: 1, verticalAlign: 'middle', color: themeColors.primary, fontSize: 36, position: 'relative', top: -6 }} /> BRIEF DETAILS
              </Typography>

              <Box sx={{
                display: 'flex',
                gap: { xs: 2, md: 4 },
                mb: 2,
                px: { xs: 0.5, sm: 2, md: 6 },
                flexDirection: { xs: 'column', md: 'row' }
              }}>
                <Box sx={{
                  minWidth: { md: 150 },
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  ml: { xs: 0, md: 3 }
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      onClick={handleAvatarClick}
                      src={(imagePreview || imgSrc) || undefined}
                      alt="Profile"
                      imgProps={{
                        onError: () => setImgSrc(""),
                        crossOrigin: 'anonymous'
                      }}
                      sx={{
                        width: { xs: 120, sm: 140, md: 170 },
                        height: { xs: 120, sm: 140, md: 170 },
                        borderRadius: '50%',
                        background: (imagePreview || imgSrc) ? "#2c2e32" : avatarFallbackBg,
                        color: '#fff',
                        fontSize: { xs: 36, sm: 42, md: 56 },
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {!(imagePreview || imgSrc) ? avatarInitials : <Person sx={{ fontSize: 70, color: themeColors.textFaint }} />}
                    </Avatar>
                    {/* Hidden file input for gallery */}
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </Box>
                  <Typography sx={{ mt: 1.5, fontWeight: 400, fontSize: { xs: 16, sm: 20 }, color: '#fff', fontFamily: 'var(--font-woodford-bourne-pro)', textAlign: 'center' }}>
                    {userDisplayName}
                  </Typography>
                  {/* Removed bottom Upload button per request */}
                </Box>

                <Box sx={{ flex: 1, pr: 0.5 }}>
                  <Grid container spacing={0.5}>
                    <Grid item xs={6} sm={6}>
                      <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>First Name</Typography>
                      <StyledTextField size="small" value={firstName} onChange={e => setFirstName((e.target.value || "").slice(0, 20))} fullWidth placeholder="First Name" inputProps={{ maxLength: 20 }} sx={{ mb: 1 }} />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Last Name</Typography>
                      <StyledTextField size="small" value={lastName} onChange={e => setLastName((e.target.value || "").slice(0, 20))} fullWidth placeholder="Last Name" inputProps={{ maxLength: 20 }} sx={{ mb: 1 }} />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Email</Typography>
                      <StyledTextField size="small" type="email" value={email} onChange={e => setEmail((e.target.value || "").slice(0, 40))} fullWidth placeholder="123@gmail.com" inputProps={{ maxLength: 40 }} sx={{ mb: 1 }} />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Change Password</Typography>
                      <StyledTextField
                        size="small"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => handlePasswordChange(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        fullWidth
                        error={Boolean(passwordError)}
                        helperText={passwordError}
                        inputProps={{ minLength: 6, maxLength: 16, autoComplete: "new-password" }}
                        autoComplete="new-password"
                        sx={{ mb: 1 }}
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                              {showPassword ? <VisibilityOff sx={{ color: themeColors.primary }} /> : <Visibility sx={{ color: themeColors.primary }} />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>

                    <Grid container spacing={1} mt={0.5} ml={0} sx={{ width: '100%' }}>
                      {/* Simplified Country & City/State inputs */}
                      <Grid item xs={12}>
                        <Grid container spacing={1}>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Country/Region</Typography>
                            <StyledTextField
                              size="small"
                              value={selectedProfileCountryCode}
                              select
                              onChange={e => {
                                const nextCountryCode = e.target.value
                                const matchedCountry = profileCountries.find((c) => c.isoCode === nextCountryCode)
                                const nextCountryName = matchedCountry?.name || ""
                                setCountry(nextCountryName)
                                setStateProvince("")
                                setCity("")
                                if (matchedCountry?.isoCode) {
                                  setPhoneCountryCode(matchedCountry.isoCode)
                                }
                              }}
                              placeholder="Select country"
                              fullWidth
                              sx={{ mb: 1, '& .MuiSelect-icon': { color: '#fff' } }}
                              SelectProps={{ MenuProps: selectMenuProps }}
                            >
                              <MenuItem value="" disabled>
                                Select country
                              </MenuItem>
                              {profileCountries.map((c) => (
                                <MenuItem key={c.isoCode} value={c.isoCode}>
                                  {c.name}
                                </MenuItem>
                              ))}
                            </StyledTextField>
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>City/State</Typography>
                            <StyledTextField
                              size="small"
                              value={city || stateProvince}
                              select
                              onChange={(e) => {
                                const v = e.target.value
                                setCity(v)
                                setStateProvince(v)
                              }}
                              placeholder="Select city/state"
                              fullWidth
                              sx={{ mb: 1, '& .MuiSelect-icon': { color: '#fff' } }}
                              SelectProps={{
                                MenuProps: selectMenuProps,
                              }}
                              disabled={!selectedProfileCountryCode || profileStates.length === 0}
                            >
                              <MenuItem value="" disabled>
                                {selectedProfileCountryCode ? "Select city/state" : "Select country first"}
                              </MenuItem>
                              {profileStates.map((s) => {
                                const stateName = normalizeLocationName(s.name) || s.name
                                return (
                                  <MenuItem key={s.isoCode} value={stateName}>
                                    {stateName}
                                  </MenuItem>
                                )
                              })}
                            </StyledTextField>
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Phone Number</Typography>
                            <StyledTextField
                              size="small"
                              type="tel"
                              value={phone}
                              onChange={e => {
                                const digits = sanitizePhoneDigits(e.target.value).slice(0, selectedPhoneRule.max)
                                setPhone(digits)
                              }}
                              placeholder="Enter phone digits"
                              fullWidth
                              inputProps={{ maxLength: selectedPhoneRule.max, inputMode: "numeric", pattern: "[0-9]*" }}
                              error={Boolean(phoneError)}
                              helperText={phoneError || selectedPhoneHint}
                              FormHelperTextProps={{
                                sx: {
                                  color: phoneError ? "#ff6b6b !important" : `${themeColors.textDim} !important`,
                                  fontSize: "0.72rem",
                                }
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start" sx={{ height: "100%" }}>
                                    <Select
                                      value={phoneCountryCode}
                                      onChange={(e) => setPhoneCountryCode(e.target.value as string)}
                                      variant="standard"
                                      disableUnderline
                                      MenuProps={selectMenuProps}
                                      sx={{
                                        minWidth: 78,
                                        mr: 1,
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        "& .MuiSelect-select": {
                                          color: themeColors.text,
                                          fontSize: "0.85rem",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        },
                                        "& .MuiSvgIcon-root": { color: themeColors.text },
                                      }}
                                      renderValue={(selected) => {
                                        const code = selected as string
                                        const c = phoneCountries.find((cc) => cc.isoCode === code)
                                        const flagUrl = getCountryFlagUrl(code)
                                        const phoneDial = c?.phonecode ? `+${c.phonecode}` : ""
                                        return (
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {flagUrl ? (
                                              <Box
                                                component="img"
                                                src={flagUrl}
                                                alt={`${code} flag`}
                                                sx={{
                                                  width: 20,
                                                  height: 15,
                                                  borderRadius: "2px",
                                                  objectFit: "cover",
                                                  border: "1px solid rgba(255,255,255,0.18)",
                                                }}
                                              />
                                            ) : null}
                                            <Box component="span" sx={{ color: themeColors.text }}>
                                              {phoneDial}
                                            </Box>
                                          </Box>
                                        )
                                      }}
                                    >
                                      {phoneCountries.map((c) => {
                                        const flagUrl = getCountryFlagUrl(c.isoCode)
                                        return (
                                          <MenuItem key={c.isoCode} value={c.isoCode}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                              {flagUrl ? (
                                                <Box
                                                  component="img"
                                                  src={flagUrl}
                                                  alt={`${c.isoCode} flag`}
                                                  sx={{
                                                    width: 20,
                                                    height: 15,
                                                    borderRadius: "2px",
                                                    objectFit: "cover",
                                                    border: "1px solid rgba(255,255,255,0.18)",
                                                    flexShrink: 0,
                                                  }}
                                                />
                                              ) : null}
                                              <Box component="span" sx={{ color: themeColors.text }}>
                                                {c.name} ({c.isoCode}){c.phonecode ? ` +${c.phonecode}` : ""}
                                              </Box>
                                            </Box>
                                          </MenuItem>
                                        )
                                      })}
                                    </Select>
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ mb: 1 }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Age</Typography>
                            <StyledTextField size="small" type="number" value={age} onChange={e => setAge(e.target.value)} fullWidth placeholder="00" sx={{ mb: 1 }} />
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Gender</Typography>
                            <Card
                              sx={{
                                p: 0.5,
                                background: "#171717",
                                border: `1px solid rgba(255,255,255,0.5)`,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: 44,
                                overflow: 'visible',
                              }}
                            >
                              <FormControl component="fieldset" sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                  <RadioGroup
                                    row
                                    value={gender}
                                    onChange={e => setGender(e.target.value)}
                                    sx={{
                                      width: '100%',
                                      justifyContent: 'space-between',
                                      flexWrap: 'nowrap',
                                      columnGap: { xs: 0.4, sm: 1.2 },
                                      '& .MuiFormControlLabel-root': {
                                        m: 0,
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        justifyContent: 'center',
                                      },
                                      '& .MuiFormControlLabel-label': {
                                        fontSize: { xs: 12, sm: 13 },
                                        color: themeColors.textDim,
                                        letterSpacing: .2,
                                        whiteSpace: 'nowrap',
                                      }
                                    }}
                                  >
                                    <FormControlLabel value="male" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }} />} label="Male" />
                                    <FormControlLabel value="female" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }} />} label="Female" />
                                  </RadioGroup>
                                </Box>
                              </FormControl>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Preferred Foot</Typography>
                            <Card
                              sx={{
                                p: 0.5,
                                background: "#171717",
                                border: `1px solid rgba(255,255,255,0.5)`,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: 44,
                                overflow: 'visible',
                              }}
                            >
                              <FormControl component="fieldset" sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                  <RadioGroup
                                    row
                                    value={preferredFoot}
                                    onChange={e => setPreferredFoot(e.target.value)}
                                    sx={{
                                      width: '100%',
                                      justifyContent: 'space-between',
                                      flexWrap: 'nowrap',
                                      columnGap: { xs: 0.4, sm: 1.2 },
                                      '& .MuiFormControlLabel-root': {
                                        m: 0,
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        justifyContent: 'center',
                                      },
                                      '& .MuiFormControlLabel-label': {
                                        fontSize: { xs: 12, sm: 13 },
                                        color: themeColors.textDim,
                                        letterSpacing: .2,
                                        whiteSpace: 'nowrap',
                                      }
                                    }}
                                  >
                                    <FormControlLabel value="Left" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }} />} label="Left" />
                                    <FormControlLabel value="Right" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }} />} label="Right" />
                                  </RadioGroup>
                                </Box>
                              </FormControl>
                            </Card>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Grid container spacing={3} justifyContent="space-between" sx={{ px: { xs: 1.25, sm: 3, md: 6 } }}>
                <Grid item xs={12}>
                  <Typography sx={{ mb: 0.8, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text, ml: 0, maxWidth: 900, mx: 'auto' }}>Position Type</Typography>
                  <Card sx={{
                    p: 2.2,
                    background: "#171717",
                    border: `1px solid rgba(255,255,255,0.5)`,
                    borderRadius: 1.5,
                    maxWidth: 900,
                    mx: 'auto'
                  }}>
                    <FormControl component="fieldset" sx={{ width: '100%' }}>
                      <RadioGroup
                        value={positionType}
                        onChange={e => setPositionType(e.target.value)}
                        sx={{
                          px: { xs: 0.5, sm: 2 },
                          display: 'grid',
                          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                          columnGap: { xs: 0.75, sm: 1.25 },
                          rowGap: { xs: 1, sm: 0.5 },
                          alignItems: 'center',
                          '& .MuiFormControlLabel-root': {
                            m: 0,
                            minWidth: 0,
                            width: '100%',
                            justifyContent: 'flex-start',
                            pl: { xs: 0.25, sm: 0.5 },
                          },
                        }}
                      >
                        {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(type => (
                          <FormControlLabel
                            key={type}
                            value={type}
                            control={<StyledRadio />}
                            label={<span style={{
                              color: positionType === type ? themeColors.text : themeColors.textDim,
                              fontWeight: positionType === type ? 700 : 500
                            }}>{type}</span>}
                            sx={{ mr: 0 }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={5}>
                  <Typography sx={{ mb: 0.8, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Specific Position</Typography>
                  <Card sx={{
                    p: 2,
                    pl: { xs: 1.5, sm: 4 },
                    background: "#171717",
                    border: `1px solid rgba(255,255,255,0.5)`,
                    borderRadius: 2,
                    maxWidth: { xs: '100%', sm: 400 },
                    width: '100%'
                  }}>
                    <FormControl component="fieldset">
                      <RadioGroup
                        value={position}
                        onChange={e => setPosition(e.target.value)}
                        sx={{
                          minHeight: specificPositionRowHeight * specificPositionRowsTarget,
                          justifyContent: useExpandedPositionSpacing ? 'space-between' : 'flex-start',
                          '& .MuiFormControlLabel-root': {
                            m: 0,
                            minHeight: specificPositionRowHeight
                          }
                        }}
                      >
                        {currentPositionOptions.map(p => (
                          <FormControlLabel key={p} value={p} control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>{p}</span>} />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={5}>
                  <Typography sx={{ mb: 0.8, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Playing Style</Typography>
                  <Card sx={{
                    p: 2,
                    pl: { xs: 1.5, sm: 4 },
                    background: "#171717",
                    border: `1px solid rgba(255,255,255,0.5)`,
                    borderRadius: 2,
                    maxWidth: { xs: '100%', sm: 400 },
                    width: '100%'
                  }}>
                    <FormControl component="fieldset">
                      <RadioGroup value={style} onChange={e => setStyle(e.target.value)}>
                        {currentStyleOptions.map(s => (
                          <FormControlLabel key={s} value={s} control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>{s}</span>} />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>
              </Grid>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={{ xs: 1.25, sm: 1 }}
                sx={{ mt: 4, px: { xs: 1.25, sm: 3, md: 6 } }}
              >
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteProfile}
                  sx={{
                    borderRadius: 1,
                    px: 4,
                    width: { xs: '100%', sm: 220 },
                    height: 44,
                    fontWeight: 600,
                  }}
                >
                  Delete Account
                </Button>

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  <Button
                    variant="outlined"
                    onClick={handlePrevious}
                    startIcon={<ArrowBack />}
                    sx={{
                      borderRadius: 1,
                      px: 3,
                      width: { xs: '48%', sm: 220 },
                      height: 44,
                      borderColor: themeColors.primary,
                      color: themeColors.text,
                      fontWeight: 600,
                      '&:hover': { background: themeColors.primarySoft, borderColor: themeColors.primaryAlt }
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => void handleUpdateProfile()}
                    disabled={isUpdating}
                    startIcon={isUpdating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
                    sx={{
                      borderRadius: 1,
                      px: 3,
                      width: { xs: '48%', sm: 220 },
                      height: 44,
                      background: themeColors.primaryGradient,
                      fontWeight: 700,
                      '&:hover': { opacity: .9 }
                    }}
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </Stack>
              </Stack>
            </StyledPaper>
            {/* Avatar Options Modal */}
            <Modal open={avatarOptionsOpen} onClose={() => setAvatarOptionsOpen(false)}>
              <Box sx={{
                position: 'absolute',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                bgcolor: '#1f1f1f', color: '#fff', p: { xs: 2, sm: 3 }, borderRadius: 2,
                width: 'min(420px, 92vw)', minWidth: 'auto', border: `1px solid ${themeColors.border}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Update Profile Image</Typography>
                <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                  <Button variant="contained" onClick={handleOpenCamera} sx={{ textTransform: 'none', fontWeight: 700, background: themeColors.primaryGradient }}>
                    Take a new photo
                  </Button>
                  <Button variant="outlined" onClick={openGalleryPicker} sx={{ textTransform: 'none', fontWeight: 700, borderColor: themeColors.primary, color: '#fff' }}>
                    Upload a new photo
                  </Button>
                  {/* {imgSrc && imgSrc !== fallbackImgSrc && (
                    <Button
                      variant="outlined"
                      onClick={handleDeleteProfilePicture}
                      disabled={isUpdating}
                      sx={{ textTransform: 'none', fontWeight: 700, borderColor: themeColors.danger, color: themeColors.danger, '&:hover': { background: 'rgba(211,47,47,0.1)', borderColor: themeColors.danger } }}
                    >
                      Delete image
                    </Button>
                  )} */}
                </Stack>
              </Box>
            </Modal>

            {/* Camera Modal */}
            <Modal open={cameraOpen} onClose={handleCloseCamera}>
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                bgcolor: '#1f1f1f',
                color: '#fff',
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                width: 'min(460px, 92vw)',
                maxWidth: '92vw',
                maxHeight: '92vh',
                overflowY: 'auto',
                border: `1px solid ${themeColors.border}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Camera</Typography>
                <Box sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: { xs: '4 / 5', sm: '3 / 4' },
                  maxHeight: 'min(62vh, 560px)',
                  bgcolor: '#000',
                  mb: 2,
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="center"
                  sx={{ '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } } }}
                >
                  <Button onClick={handleTakePhoto} variant="contained" sx={{ textTransform: 'none', fontWeight: 700, background: themeColors.primaryGradient }}>Capture</Button>
                  <Button onClick={handleCloseCamera} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderColor: themeColors.primary, color: '#fff' }}>Close</Button>
                </Stack>
              </Box>
            </Modal>
          </Box>
        </Fade>
      </Container>
    )
  }

  // ---------- STEP 3 ----------
  if (step === 3) {
    const skills = [
      { name: "Dribbling", value: dribbling, setter: setDribbling, icon: Dribbling },
      { name: "Shooting", value: shooting, setter: setShooting, icon: Shooting },
      { name: "Passing", value: passing, setter: setPassing, icon: Passing },
      { name: "Pace", value: pace, setter: setPace, icon: Pace },
      { name: "Defending", value: defending, setter: setDefending, icon: Defending },
      { name: "Physical", value: physical, setter: setPhysical, icon: Physical }
    ]

    return (
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
          maxWidth: 1070,
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Fade in timeout={600}>
          <Box>
            <StyledPaper sx={{
              p: { xs: 1.25, sm: 1.5 },
              background: "#1f1f1f",
              borderRadius: 2
            }}>
              <Stepper activeStep={activeWizardStep} sx={{
                mb: 1.5,
                maxWidth: 700,
                mx: 'auto',
                '& .MuiStepIcon-root.Mui-active': { color: '#00a77f' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00a77f' },
                '& .MuiStepConnector-line': { borderTopWidth: '1px' },
                '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } }
              }}>
                {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff !important', fontWeight: 600, fontFamily: 'var(--font-woodford-bourne-pro)', fontSize: '1rem', letterSpacing: .5, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff !important' }, '& .MuiStepLabel-label.Mui-completed': { color: '#fff !important' } }}>{label}</StepLabel></Step>)}
              </Stepper>
              <Box sx={{ width: '100%', height: 2, background: '#fff', mx: 0, mb: 3, opacity: 0.80 }} />

              <Typography variant="h5" fontWeight={600} align="center" sx={{
                mb: 2,
                color: '#fff',
                letterSpacing: .5,
                fontFamily: 'var(--font-woodford-bourne-pro)',
                fontSize: { xs: '1.2rem', sm: '1.75rem' },
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}>
                SKILLS & ATTRIBUTES
              </Typography>

              <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mt: 1, px: { xs: 1, sm: 3, md: 6 } }}>
                {skills.map(skill => {
                  const labelInfo = getSkillLabel(skill.value ?? 50)
                  const solidColor = labelInfo.color.replace('linear-gradient(90deg,', '').split(',')[0]
                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      key={skill.name}
                      sx={{ display: 'flex' }}
                    >
                      <SkillCard
                        sx={{
                          flex: 1,
                          display: 'flex',
                          minHeight: { xs: 150, sm: 170 },
                          maxHeight: { xs: 'none', sm: 170 }
                        }}
                      >
                        <CardContent
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            p: 2.2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
                            <Image src={skill.icon} alt="icon" width={skill.name === "Physical" ? 36 : 42} height={skill.name === "Physical" ? 36 : 42} />
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{ color: themeColors.text, letterSpacing: .4, fontSize: { xs: 18, sm: 22 } }}
                            >
                              {skill.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={skill.value ?? 50}
                              sx={{
                                ml: 'auto',
                                fontSize: 13,
                                fontWeight: 700,
                                background: labelInfo.color,
                                color: '#fff',
                                height: 24,
                                borderRadius: 1,
                                px: 0.5
                              }}
                            />
                          </Box>

                          <Box mt="auto" sx={{ px: 1.5 /* add horizontal padding so thumb not stuck to edge */ }}>
                            <StyledSlider
                              value={skill.value ?? 50}
                              onChange={(e, v) => skill.setter(v as number)}
                              min={50}
                              max={99}
                              step={1}
                              sx={{
                                '& .MuiSlider-track': {
                                  background: labelInfo.color
                                },
                                '& .MuiSlider-thumb': {
                                  border: `3px solid ${solidColor}`,
                                  '&:hover': { 
                                    boxShadow: `0 0 0 6px ${solidColor}40`
                                  },
                                  '&:focus-visible': { 
                                    boxShadow: `0 0 0 8px ${solidColor}4D`
                                  }
                                }
                              }}
                            />
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                              <Chip
                                label={labelInfo.text}
                                sx={{
                                  background: labelInfo.color,
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '.8rem',
                                  px: 1.5,
                                  borderRadius: 2,
                                  height: 24
                                }}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </SkillCard>
                    </Grid>
                  )
                })}
              </Grid>

              <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                sx={{ mt: 5, px: { xs: 1, sm: 3, md: 6 } }}
              >
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 1,
                    px: 3,
                    width: { xs: '48%', sm: 220 },
                    height: 44,
                    borderColor: themeColors.primary,
                    color: themeColors.text,
                    fontWeight: 600,
                    '&:hover': { background: themeColors.primarySoft, borderColor: themeColors.primaryAlt }
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    borderRadius: 1,
                    px: 3,
                    width: { xs: '48%', sm: 220 },
                    height: 44,
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    '&:hover': { opacity: .9 }
                  }}
                >
                  Next
                </Button>
              </Stack>
            </StyledPaper>
          </Box>
        </Fade>
        <Toaster position="top-center" reverseOrder={false} />
      </Container>
    )
  }

  return null
}

export default PlayerProfileCard

