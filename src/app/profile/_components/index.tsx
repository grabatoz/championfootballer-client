"use client"
import { useAuth } from "@/lib/hooks"
import type React from "react"
import { useState, useEffect, useRef } from "react"
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
} from "@mui/material"
import { MenuItem } from "@mui/material"
import { styled } from "@mui/material/styles"
import { updateProfile, deleteProfile } from "@/lib/api"
import { cacheManager } from "@/lib/cacheManager"
import { useRouter } from "next/navigation"
import toast, { Toaster } from 'react-hot-toast';
import Dribbling from '@/Components/images/Dribbling.png'
import Pace from '@/Components/images/pace.png'
import Physical from '@/Components/images/physical.png'
import Passing from '@/Components/images/passing.png'
import Shooting from '@/Components/images/shooting.png'
import Defending from '@/Components/images/defending.png'
import Image from "next/image"
import type { StaticImageData } from "next/image"
import imgicon from "@/Components/images/imgicon.png"
import { useDispatch } from "react-redux"
import { mergeUser, syncWithStorage } from "@/lib/features/authSlice"
import { Country, State, City } from "country-state-city"
import type { ICountry, IState, ICity } from "country-state-city"


// ===== THEME (brand palette reused) =====
const themeColors = {
  primary: "#E56A16",
  primaryAlt: "#CF2326",
  primaryGradient: "linear-gradient(135deg,#E56A16 0%,#CF2326 100%)",
  primarySoft: "linear-gradient(135deg,rgba(229,106,22,0.25) 0%, rgba(207,35,38,0.25) 100%)",
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
  sliderTrack: "linear-gradient(90deg,#E56A16,#CF2326)"
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
  background: "linear-gradient(135deg,#242529 0%,#2d2f33 100%)",
  borderRadius: 16,
  color: themeColors.text,
  position: "relative",
  border: `1px solid ${themeColors.border}`,
  boxShadow: "0 6px 22px -6px rgba(0,0,0,0.65)",
  transition: "transform .35s, box-shadow .35s, border-color .35s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 14px 38px -8px rgba(0,0,0,0.75)",
    borderColor: themeColors.borderStrong
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
    '&:hover': { boxShadow: '0 0 0 6px rgba(229,106,22,0.25)' },
    '&:focus-visible': { boxShadow: '0 0 0 8px rgba(229,106,22,0.30)' }
  }
}))

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    background: "#202225",
    color: themeColors.text,
    borderRadius: 10,
    border: `1px solid ${themeColors.border}`,
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
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
    WebkitBoxShadow: '0 0 0 1000px #202225 inset !important',
    boxShadow: '0 0 0 1000px #202225 inset !important',
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
  if (value >= 90) return { text: `${value} Elite`, color: themeColors.primaryGradient }
  if (value >= 80) return { text: `${value} Pro`, color: themeColors.primaryGradient }
  if (value >= 70) return { text: `${value} Advanced`, color: themeColors.primaryGradient }
  return { text: `${value} Developing`, color: "linear-gradient(90deg,#666,#444)" }
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

// Shape of possible API error objects (optional)
// interface ApiError {
//   message?: string
//   status?: number
//   [key: string]: unknown
// }

const PlayerProfileCard = () => {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated } = useAuth()
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
  const [age, setAge] = useState(user?.age || "00")
  const [gender, setGender] = useState(user?.gender || "")
  const [positionType, setPositionType] = useState(user?.positionType || "")
  const [position, setPosition] = useState(user?.position || "Goalkeeper (GK)")
  const [style, setStyle] = useState(user?.style || "")
  const [preferredFoot, setPreferredFoot] = useState(user?.preferredFoot || "Left")
  // const [shirtNumber, ] = useState(user?.shirtNumber || "00")
  // setShirtNumber
  // Location fields
  const [country, setCountry] = useState(user?.country || "")
  const [stateProvince, setStateProvince] = useState(user?.state || "")
  const [city, setCity] = useState(user?.city || "")
  // Selection codes for cascading lists
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")
  const [selectedStateCode, setSelectedStateCode] = useState<string>("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [showPassword, setShowPassword] = useState(false)
  const [, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fallbackImgSrc = (imgicon as StaticImageData).src
  const safeSrc = (v: unknown) => typeof v === "string" && v.trim().length ? v : fallbackImgSrc
  const [imgSrc, setImgSrc] = useState<string>(safeSrc(user?.profilePicture))
  // For avatar options and camera
  const [avatarOptionsOpen, setAvatarOptionsOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()
  const steps = ["Profile Overview", "Basic Info", "Skills & Stats"]

  // Playing styles per position type (3 options each; you can edit/rename later)
  const playingStylesMap: Record<"Goalkeeper" | "Defender" | "Midfielder" | "Forward", string[]> = {
    Goalkeeper: ["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Spider" ,"Sweeper Keeper"],
    Defender: ["Hacker", "No-Bull", "Shield" , "Terminator" , "Wall" , "Warrior"],
    Midfielder: ["Gladiator", "Maestro", "Magician" , "Powerhouse" , "Roadrunner" , "Scientist"],
    Forward: ["Finisher", "Poacher", "Predator" , "Rocket" ,"Ruthless" , "Sniper"],
  }

  const resolvedPositionType: "Goalkeeper" | "Defender" | "Midfielder" | "Forward" =
    (positionType === "Goalkeeper" || positionType === "Defender" || positionType === "Midfielder" || positionType === "Forward")
      ? positionType
      : "Goalkeeper"

  const currentStyleOptions = playingStylesMap[resolvedPositionType]

  // Compute location lists
  const countries: ICountry[] = Country.getAllCountries() || []
  const states: IState[] = selectedCountryCode ? (State.getStatesOfCountry(selectedCountryCode) || []) : []
  const cities: ICity[] = selectedCountryCode
    ? ((selectedStateCode && (State.getStatesOfCountry(selectedCountryCode)?.length ?? 0) > 0)
        ? (City.getCitiesOfState(selectedCountryCode, selectedStateCode) || [])
        : (City.getCitiesOfCountry(selectedCountryCode) || []))
    : []

  // Initialize selection from existing user data
  useEffect(() => {
    if (user?.country && !selectedCountryCode) {
      const foundCountry = countries.find(c => c.name.toLowerCase() === String(user.country).toLowerCase())
      if (foundCountry) {
        setSelectedCountryCode(foundCountry.isoCode)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.country])

  useEffect(() => {
    if (user?.state && selectedCountryCode && !selectedStateCode) {
      const ss = State.getStatesOfCountry(selectedCountryCode)
      const foundState = ss.find(s => s.name.toLowerCase() === String(user.state).toLowerCase())
      if (foundState) {
        setSelectedStateCode(foundState.isoCode)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.state, selectedCountryCode])

  // Handlers for cascading selection
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code)
    const c = countries.find(c => c.isoCode === code)
    setCountry(c?.name || "")
    // reset dependent fields
    setSelectedStateCode("")
    setStateProvince("")
    setCity("")
  }
  const handleStateChange = (code: string) => {
    setSelectedStateCode(code)
    const s = states.find(s => s.isoCode === code)
    setStateProvince(s?.name || "")
    setCity("")
  }
  const handleCityChange = (name: string) => {
    setCity(name)
  }

  useEffect(() => { setImgSrc(safeSrc(user?.profilePicture)) }, [user?.profilePicture])

  useEffect(() => {
    if (user?.position) {
      const p = user.position
      if (p.includes("Goalkeeper")) { setPositionType("Goalkeeper"); setPosition(p) }
      else if (p.includes("Back") || p.includes("Wing-back")) { setPositionType("Defender"); setPosition(p) }
      else if (p.includes("Midfielder")) { setPositionType("Midfielder"); setPosition(p) }
      else if (p.includes("Forward") || p.includes("Striker") || p.includes("Winger")) { setPositionType("Forward"); setPosition(p) }
      else { setPositionType("Goalkeeper"); setPosition("Goalkeeper (GK)") }
    } else {
      setPositionType("Goalkeeper")
      setPosition("Goalkeeper (GK)")
    }
  }, [user?.position])

  // Note: Do not auto-change playing style on position type change.
  // We keep whatever is in DB/user selection; RadioGroup will show none selected
  // if the current style isn't in the options for the chosen position type.

  const handleNext = () => setStep(s => s + 1)
  const handlePrevious = () => setStep(s => s > 1 ? s - 1 : s)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setIsUpdating(true)
      setError("")
      if (!isAuthenticated || !token) throw new Error("Not authenticated. Please login again.")

      // Helper to treat undefined/null/empty-string as blank
      const isBlank = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')

      // Build payload by including only non-blank fields
      const updateData: Record<string, unknown> = {}

      if (!isBlank(firstName)) updateData.firstName = firstName.trim()
      if (!isBlank(lastName)) updateData.lastName = lastName.trim()
      if (!isBlank(email)) updateData.email = email.trim()

      if (!isBlank(age)) {
        const parsedAge = Number(String(age).trim())
        if (!Number.isNaN(parsedAge)) updateData.age = parsedAge
      }

      if (!isBlank(gender)) updateData.gender = gender

      // Core football fields (radio groups are never blank in UI, but keep guard anyway)
      if (!isBlank(position)) updateData.position = position
      if (!isBlank(positionType)) updateData.positionType = positionType
      if (!isBlank(style)) updateData.style = style
      if (!isBlank(preferredFoot)) updateData.preferredFoot = preferredFoot

      // Shirt number is hidden in UI; do not update it to avoid accidental overwrites
      // if (!isBlank(shirtNumber)) updateData.shirtNumber = String(shirtNumber).trim()

      // Location: only include if selected (avoid writing empty to DB)
      if (!isBlank(country)) updateData.country = country
      if (!isBlank(stateProvince)) updateData.state = stateProvince
      if (!isBlank(city)) updateData.city = city

      // Skills: include only the ones that have numeric values; skip otherwise
      const skillsUpdate: Record<string, number> = {}
      if (typeof dribbling === 'number') skillsUpdate.dribbling = dribbling
      if (typeof shooting === 'number') skillsUpdate.shooting = shooting
      if (typeof passing === 'number') skillsUpdate.passing = passing
      if (typeof pace === 'number') skillsUpdate.pace = pace
      if (typeof defending === 'number') skillsUpdate.defending = defending
      if (typeof physical === 'number') skillsUpdate.physical = physical
      if (Object.keys(skillsUpdate).length > 0) updateData.skills = skillsUpdate

      // Password: only if user actually entered something non-blank
      if (!isBlank(password)) updateData.password = password

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
          state: data.user.state,
          city: data.user.city,
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

      toast.success("Profile updated successfully!")
      // Optional: refresh app router cache for any server components
      // router.refresh?.()
      router.push("/home")
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!token) return
    if (!window.confirm("Delete account permanently? This cannot be undone.")) return
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
      const data = await res.json()
      if (data.success) {
        const newUrl: string | undefined = data.user?.profilePicture
        if (data.user) cacheManager.updatePlayersCache(data.user)
        if (newUrl) {
          setImgSrc(newUrl)
          setImagePreview(null)
          dispatch(mergeUser({ profilePicture: newUrl, image: newUrl }))
          dispatch(syncWithStorage())
          localStorage.setItem('avatar_url', newUrl)
          localStorage.setItem('avatar_v', String(Date.now()))
        }
        toast.success('Profile picture updated!')
      } else {
        toast.error(data?.message || 'Upload failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Upload failed')
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

  //       // Update PlayerCard’s localStorage readers
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
      <Container maxWidth="sm" sx={{
        py: 4,
        display: 'flex',
        justifyContent: 'center',
        // background: "linear-gradient(177deg,rgba(229,106,22,0.15) 0%, rgba(207,35,38,0.15) 80%)",
        borderRadius: 4
      }}>
        <Fade in timeout={600}>
          <Box>
            <Stepper activeStep={step - 1} sx={{
              mb: 4,
              '& .MuiStepIcon-root.Mui-active': { color: themeColors.primary },
              '& .MuiStepIcon-root.Mui-completed': { color: themeColors.primaryAlt }
            }}>
              {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: themeColors.textDim } }}>{label}</StepLabel></Step>)}
            </Stepper>

            <StyledPaper sx={{
              p: 2,
              borderRadius: 5,
              maxWidth: 380,
              mx: 'auto',
              background: "linear-gradient(150deg,#1d1f23 0%,#25272b 55%)",
              border: `1px solid ${themeColors.border}`,
            }}>
              <Box sx={{ display: 'flex', gap: 1.5, width: '100%', height: 180 }}>
                <Avatar
                  src={imgSrc}
                  alt="Profile"
                  imgProps={{
                    onError: () => setImgSrc(fallbackImgSrc),
                    referrerPolicy: 'no-referrer',
                    crossOrigin: 'anonymous'
                  }}
                  sx={{
                    width: 115,
                    height: 160,
                    border: `3px solid ${themeColors.primary}`,
                    borderRadius: 3,
                    background: "#2f3033",
                    boxShadow: "0 4px 18px -4px rgba(0,0,0,0.6)"
                  }}
                >
                  <Person sx={{ fontSize: 62, color: themeColors.textFaint }} />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Typography variant="h5" fontWeight={800} sx={{
                    color: themeColors.text,
                    lineHeight: 1.15,
                    textShadow: "0 2px 12px rgba(0,0,0,0.5)"
                  }}>
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Player Name"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim, mt: .5 }}>Age: <b style={{ color: themeColors.text }}>{user?.age || "18"}</b></Typography>
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim, display: 'flex', gap: .5 }}>
                    Email: <span style={{ color: themeColors.text }}>{user?.email || "email@example.com"}</span>
                  </Typography>
                  {/* Shirt number hidden per request */}
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim }}>Foot: <b style={{ color: themeColors.text }}>{user?.preferredFoot || "Right"}</b></Typography>
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
                    <Sports fontSize="small" sx={{ color: themeColors.primary }} /> Skills Overview
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

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2.8 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => router.push('/home')}
                  startIcon={<ArrowBack />}
                  sx={{
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    px: 2.4,
                    borderRadius: 2,
                    boxShadow: "0 6px 16px -4px rgba(0,0,0,0.6)",
                    '&:hover': { opacity: .9 }
                  }}
                >Home</Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    px: 2.4,
                    borderRadius: 2,
                    boxShadow: "0 6px 16px -4px rgba(0,0,0,0.6)",
                    '&:hover': { opacity: .9 }
                  }}
                >Edit Profile</Button>
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in timeout={600}>
          <Box>
            <Stepper activeStep={step - 1} sx={{
              mb: 4,
              '& .MuiStepIcon-root.Mui-active': { color: themeColors.primary },
              '& .MuiStepIcon-root.Mui-completed': { color: themeColors.primaryAlt }
            }}>
              {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: themeColors.textDim } }}>{label}</StepLabel></Step>)}
            </Stepper>

            <StyledPaper sx={{
              p: 3,
              background: "linear-gradient(145deg,#202226 0%,#27292d 60%)",
              borderRadius: 6
            }}>
              <Typography variant="h5" fontWeight={800} align="center" sx={{
                mb: 2,
                color: themeColors.text,
                letterSpacing: .5,
                background: themeColors.primaryGradient,
                WebkitBackgroundClip: "text",
                colorAdjust: "exact",
                // color: "transparent"
              }}>
                <AccountCircle sx={{ mr: 1, verticalAlign: 'middle', color: themeColors.primary }} /> Basic Information
              </Typography>

              <Box sx={{
                display: 'flex',
                gap: 4,
                mb: 2,
                flexDirection: { xs: 'column', md: 'row' }
              }}>
                <Box sx={{
                  minWidth: { md: 150 },
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      onClick={handleAvatarClick}
                      src={imagePreview || imgSrc}
                      alt="Profile"
                      imgProps={{
                        onError: () => setImgSrc(fallbackImgSrc),
                        crossOrigin: 'anonymous'
                      }}
                      sx={{
                        width: { xs: 120, sm: 140, md: 170 },
                        height: { xs: 150, sm: 185, md: 180 },
                        border: `3px solid ${themeColors.primary}`,
                        borderRadius: 4,
                        background: "#2c2e32",
                        cursor: 'pointer'
                      }}
                    >
                      <Person sx={{ fontSize: 70, color: themeColors.textFaint }} />
                    </Avatar>
                    {/* Hidden file input for gallery */}
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </Box>
                  {/* Removed bottom Upload button per request */}
                </Box>

                <Box sx={{ flex: 1, pr: 0.5 }}>
                  <Grid container spacing={0.5}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField size="small" label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField size="small" label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField size="small" label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        size="small"
                        label="Change Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={() => setShowPassword(p => !p)} edge="end">
                              {showPassword ? <VisibilityOff sx={{ color: themeColors.primary }} /> : <Visibility sx={{ color: themeColors.primary }} />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>

                    <Grid container spacing={1} mt={0.5} ml={0.2}>
                      {/* Country / State / City selectors */}
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          {/* <StyledFormLabel sx={{ mb: 0.5 }}>Country</StyledFormLabel> */}
                          <StyledTextField
                            size="small"
                            select
                            value={selectedCountryCode}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            placeholder="Select Country"
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="" disabled>Select Country</MenuItem>
                            {countries.map(c => (
                              <MenuItem key={c.isoCode} value={c.isoCode}>{c.name}</MenuItem>
                            ))}
                          </StyledTextField>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small" disabled={!selectedCountryCode || states.length === 0}>
                          {/* <StyledFormLabel sx={{ mb: 0.5 }}>State/Province</StyledFormLabel> */}
                          <StyledTextField
                            size="small"
                            select
                            value={selectedStateCode}
                            onChange={(e) => handleStateChange(e.target.value)}
                            placeholder="Select State"
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="" disabled>{states.length ? 'Select State' : 'No states available'}</MenuItem>
                            {states.map(s => (
                              <MenuItem key={s.isoCode} value={s.isoCode}>{s.name}</MenuItem>
                            ))}
                          </StyledTextField>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small" disabled={!selectedCountryCode || (!selectedStateCode && (cities?.length ?? 0) === 0)}>
                          {/* <StyledFormLabel sx={{ mb: 0.5 }}>City</StyledFormLabel> */}
                          <StyledTextField
                            size="small"
                            select
                            value={city}
                            onChange={(e) => handleCityChange(e.target.value)}
                            placeholder="Select City"
                            SelectProps={{ displayEmpty: true }}
                          >
                            <MenuItem value="" disabled>Select City</MenuItem>
                            {(cities ?? []).map(ci => (
                              <MenuItem key={`${ci.name}-${ci.latitude}-${ci.longitude}`} value={ci.name}>{ci.name}</MenuItem>
                            ))}
                          </StyledTextField>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3} md={2}>
                        <StyledTextField size="small" label="Age" type="number" value={age} onChange={e => setAge(e.target.value)} fullWidth />
                      </Grid>

                      <Grid item xs={12} sm={4} md={5} sx={{ mt: { xs: 2, sm: 0 } }}>
                        <Card
                          sx={{
                            p: 0.5,
                            background: "#222428",
                            border: `1px solid ${themeColors.border}`,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 44,
                            overflow: 'visible'
                          }}
                        >
                          <FormControl component="fieldset" sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StyledFormLabel sx={{ mb: 0, fontSize: 12, whiteSpace: 'nowrap', color: themeColors.text }}>Gender</StyledFormLabel>
                              <RadioGroup
                                row
                                value={gender}
                                onChange={e => setGender(e.target.value)}
                                sx={{
                                  justifyContent: 'flex-start',
                                  flexWrap: 'nowrap',
                                  gap: 1.2,
                                  '& .MuiFormControlLabel-root': { m: 0 },
                                  '& .MuiFormControlLabel-label': { fontSize: 12, color: themeColors.textDim, letterSpacing: .2 }
                                }}
                              >
                                <FormControlLabel value="male" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }} />} label="Male" />
                                <FormControlLabel value="female" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }} />} label="Female" />
                              </RadioGroup>
                            </Box>
                          </FormControl>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={5} md={5} sx={{ mt: { xs: 2, sm: 0 } }}>
                        <Card
                          sx={{
                            p: 0.5,
                            background: "#222428",
                            border: `1px solid ${themeColors.border}`,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: 44,
                            overflow: 'visible'
                          }}
                        >
                          <FormControl component="fieldset" sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StyledFormLabel sx={{ mb: 0, fontSize: 12, whiteSpace: 'nowrap', color: themeColors.text }}>Preferred Foot</StyledFormLabel>
                              <RadioGroup
                                row
                                value={preferredFoot}
                                onChange={e => setPreferredFoot(e.target.value)}
                                sx={{
                                  justifyContent: 'flex-start',
                                  flexWrap: 'nowrap',
                                  gap: 1.2,
                                  '& .MuiFormControlLabel-root': { m: 0 },
                                  '& .MuiFormControlLabel-label': { fontSize: 12, color: themeColors.textDim, letterSpacing: .2 }
                                }}
                              >
                                <FormControlLabel value="Left" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }} />} label="Left" />
                                <FormControlLabel value="Right" control={<StyledRadio size="small" sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }} />} label="Right" />
                              </RadioGroup>
                            </Box>
                          </FormControl>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{
                    p: 2.2,
                    background: "#222428",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 5
                  }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 }}>Position Type</StyledFormLabel>
                      <RadioGroup value={positionType} onChange={e => setPositionType(e.target.value)} row>
                        {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(type => (
                          <FormControlLabel
                            key={type}
                            value={type}
                            control={<StyledRadio />}
                            label={<span style={{
                              color: positionType === type ? themeColors.text : themeColors.textDim,
                              fontWeight: positionType === type ? 700 : 500
                            }}>{type}</span>}
                            sx={{ mr: 3 }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{
                    p: 2,
                    background: "#222428",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 5
                  }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 }}>Specific Position</StyledFormLabel>
                      <RadioGroup value={position} onChange={e => setPosition(e.target.value)}>
                        {positionType === "Goalkeeper" && <FormControlLabel value="Goalkeeper (GK)" control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>Goalkeeper (GK)</span>} />}
                        {positionType === "Defender" && ["Center-Back (CB)", "Right-Back (RB)", "Left-Back (LB)", "Right Wing-back (RWB)", "Left Wing-back (LWB)"].map(p => <FormControlLabel key={p} value={p} control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>{p}</span>} />)}
                        {positionType === "Midfielder" && ["Central Midfielder (CM)", "Defensive Midfielder (CDM)", "Attacking Midfielder (CAM)", "Right Midfielder (RM)", "Left Midfielder (LM)"].map(p => <FormControlLabel key={p} value={p} control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>{p}</span>} />)}
                        {positionType === "Forward" && ["Striker (ST)", "Central Forward (CF)", "Right Forward (RF)", "Left Forward (LF)", "Right Winger (RW)", "Left Winger (LW)"].map(p => <FormControlLabel key={p} value={p} control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>{p}</span>} />)}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{
                    p: 2,
                    background: "#222428",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 5
                  }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 }}>Playing Style</StyledFormLabel>
                      <RadioGroup value={style} onChange={e => setStyle(e.target.value)}>
                        {currentStyleOptions.map(s => (
                          <FormControlLabel key={s} value={s} control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>{s}</span>} />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    borderColor: themeColors.primary,
                    color: themeColors.text,
                    fontWeight: 600,
                    '&:hover': { background: themeColors.primarySoft, borderColor: themeColors.primaryAlt }
                  }}
                >Previous</Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    '&:hover': { opacity: .9 }
                  }}
                >Next</Button>
              </Stack>
            </StyledPaper>
            {/* Avatar Options Modal */}
            <Modal open={avatarOptionsOpen} onClose={() => setAvatarOptionsOpen(false)}>
              <Box sx={{
                position: 'absolute',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                bgcolor: '#1f2125', color: '#fff', p: 3, borderRadius: 2,
                minWidth: 320, border: `1px solid ${themeColors.border}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Update Profile Image</Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button variant="contained" onClick={handleOpenCamera} sx={{ textTransform: 'none', fontWeight: 700, background: themeColors.primaryGradient }}>
                    Take a new photo
                  </Button>
                  <Button variant="outlined" onClick={openGalleryPicker} sx={{ textTransform: 'none', fontWeight: 700, borderColor: themeColors.primary, color: '#fff' }}>
                    Upload a new photo
                  </Button>
                </Stack>
              </Box>
            </Modal>

            {/* Camera Modal */}
            <Modal open={cameraOpen} onClose={handleCloseCamera}>
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                bgcolor: '#1f2125', color: '#fff', p: 2, borderRadius: 2, width: 360, maxWidth: '90vw',
                border: `1px solid ${themeColors.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Camera</Typography>
                <Box sx={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', bgcolor: '#000', mb: 2, borderRadius: 1 }}>
                  <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </Box>
                <Stack direction="row" spacing={2} justifyContent="center">
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in timeout={600}>
          <Box>
            <Stepper activeStep={step - 1} sx={{
              mb: 4,
              '& .MuiStepIcon-root.Mui-active': { color: themeColors.primary },
              '& .MuiStepIcon-root.Mui-completed': { color: themeColors.primaryAlt }
            }}>
              {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: themeColors.textDim } }}>{label}</StepLabel></Step>)}
            </Stepper>

            <StyledPaper sx={{
              p: 4,
              background: "linear-gradient(140deg,#202226 0%,#272a2e 60%)",
              borderRadius: 6
            }}>
              <Typography variant="h5" fontWeight={800} align="center" sx={{
                mb: 0,
                background: "#fff",
                WebkitBackgroundClip: "text",
                color: "transparent",
                letterSpacing: .6
              }}>
                <Sports sx={{ mr: .75, color: '#fff' }} /> Skills & Attributes
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                {skills.map(skill => {
                  const labelInfo = getSkillLabel(skill.value ?? 50)
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
                          minHeight: 170,
                          maxHeight: 170
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
                            <Image src={skill.icon} alt="icon" width={42} height={42} />
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{ color: themeColors.text, letterSpacing: .4, fontSize: 14 }}
                            >
                              {skill.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={skill.value ?? 50}
                              sx={{
                                ml: 'auto',
                                fontSize: 11,
                                fontWeight: 700,
                                background: themeColors.primaryGradient,
                                color: '#fff',
                                height: 22
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
                            />
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                              <Chip
                                label={labelInfo.text}
                                sx={{
                                  background: labelInfo.color,
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '.65rem',
                                  px: 1.5,
                                  borderRadius: 2,
                                  height: 22
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

              <form onSubmit={handleUpdateProfile} style={{ width: '100%' }}>
                <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 5 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteProfile}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      fontWeight: 600,
                      borderColor: themeColors.danger,
                      color: themeColors.text,
                      '&:hover': { background: "rgba(211,47,47,0.15)", borderColor: themeColors.danger }
                    }}
                  >Delete Account</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isUpdating}
                    startIcon={isUpdating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
                    sx={{
                      borderRadius: 3,
                      px: 5,
                      fontWeight: 700,
                      background: themeColors.primaryGradient,
                      '&:hover': { opacity: .9 }
                    }}
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </Stack>
              </form>

              <Stack direction="row" justifyContent="flex-start" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    borderColor: themeColors.primary,
                    color: themeColors.text,
                    fontWeight: 600,
                    '&:hover': { background: themeColors.primarySoft, borderColor: themeColors.primaryAlt }
                  }}
                >Previous</Button>
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
