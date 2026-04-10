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
  MenuItem,
} from "@mui/material"
// Lightweight country list (can be expanded or sourced externally later)
const countryOptions = [
  "United Kingdom","United States","Canada","Australia","Germany","France","Spain","Italy","Netherlands","Brazil","Argentina","Portugal","Belgium","Sweden","Norway","Denmark","Finland","Switzerland","Austria","Ireland","Turkey","Japan","South Korea","China","India","Pakistan","Saudi Arabia","United Arab Emirates","South Africa","Nigeria","Mexico"
]

// Country → list of major cities / states for auto-filter
const countryCityMap: Record<string, string[]> = {
  "United Kingdom": ["London","Manchester","Birmingham","Liverpool","Leeds","Glasgow","Edinburgh","Bristol","Cardiff","Belfast","Sheffield","Newcastle","Nottingham","Leicester","Southampton"],
  "United States": ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Miami","Seattle","Denver"],
  "Canada": ["Toronto","Vancouver","Montreal","Calgary","Edmonton","Ottawa","Winnipeg","Quebec City","Hamilton","Halifax"],
  "Australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Newcastle","Hobart","Darwin"],
  "Germany": ["Berlin","Munich","Hamburg","Frankfurt","Cologne","Stuttgart","Düsseldorf","Dortmund","Leipzig","Dresden"],
  "France": ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille"],
  "Spain": ["Madrid","Barcelona","Valencia","Seville","Zaragoza","Malaga","Bilbao","Alicante","Cordoba","Granada"],
  "Italy": ["Rome","Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence","Venice","Verona"],
  "Netherlands": ["Amsterdam","Rotterdam","The Hague","Utrecht","Eindhoven","Groningen","Tilburg","Almere","Breda","Nijmegen"],
  "Brazil": ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte","Curitiba","Manaus","Recife","Porto Alegre"],
  "Argentina": ["Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","San Miguel de Tucumán","Mar del Plata","Salta","Santa Fe"],
  "Portugal": ["Lisbon","Porto","Braga","Coimbra","Funchal","Setúbal","Aveiro","Faro","Évora"],
  "Belgium": ["Brussels","Antwerp","Ghent","Charleroi","Liège","Bruges","Namur","Leuven","Mons"],
  "Sweden": ["Stockholm","Gothenburg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg","Norrköping"],
  "Norway": ["Oslo","Bergen","Stavanger","Trondheim","Drammen","Fredrikstad","Kristiansand","Tromsø"],
  "Denmark": ["Copenhagen","Aarhus","Odense","Aalborg","Frederiksberg","Esbjerg","Randers","Kolding"],
  "Finland": ["Helsinki","Espoo","Tampere","Vantaa","Oulu","Turku","Jyväskylä","Lahti","Kuopio"],
  "Switzerland": ["Zurich","Geneva","Basel","Bern","Lausanne","Winterthur","Lucerne","St. Gallen"],
  "Austria": ["Vienna","Graz","Linz","Salzburg","Innsbruck","Klagenfurt","Villach","Wels"],
  "Ireland": ["Dublin","Cork","Limerick","Galway","Waterford","Drogheda","Dundalk","Swords"],
  "Turkey": ["Istanbul","Ankara","Izmir","Bursa","Antalya","Adana","Konya","Gaziantep"],
  "Japan": ["Tokyo","Osaka","Yokohama","Nagoya","Sapporo","Kobe","Kyoto","Fukuoka","Hiroshima"],
  "South Korea": ["Seoul","Busan","Incheon","Daegu","Daejeon","Gwangju","Suwon","Ulsan"],
  "China": ["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Hangzhou","Wuhan","Nanjing","Xi'an"],
  "India": ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow"],
  "Pakistan": ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Sialkot","Hyderabad"],
  "Saudi Arabia": ["Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar","Tabuk","Abha"],
  "United Arab Emirates": ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Al Ain"],
  "South Africa": ["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth","Bloemfontein","Nelspruit"],
  "Nigeria": ["Lagos","Abuja","Kano","Ibadan","Port Harcourt","Benin City","Kaduna","Enugu"],
  "Mexico": ["Mexico City","Guadalajara","Monterrey","Puebla","Tijuana","León","Cancún","Mérida","Querétaro"],
}
import { styled } from "@mui/material/styles"
import { updateProfile, deleteProfile, deleteProfilePicture } from "@/lib/api"
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

// Removed CountryStateCitySelector; using simple text inputs for Country and City/State.


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
    if (!/[A-Z]/.test(pw)) return "Include at least one uppercase letter"
    if (!/[0-9]/.test(pw)) return "Include at least one number"
    if (!/[^A-Za-z0-9]/.test(pw)) return "Include at least one special character"
    return ""
  }
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
  const userDisplayName = buildPlayerDisplayName(user?.firstName, user?.lastName)

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

  useEffect(() => { setImgSrc(safeSrc(user?.profilePicture)) }, [user?.profilePicture])

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

  // Note: Do not auto-change playing style on position type change.
  // We keep whatever is in DB/user selection; RadioGroup will show none selected
  // if the current style isn't in the options for the chosen position type.

  const handleNext = () => setStep(s => s + 1)
  const handlePrevious = () => setStep(s => s > 1 ? s - 1 : s)

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordError(getPasswordError(value))
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
      if (!isBlank(phone)) updateData.phone = phone

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

      toast.success("Profile updated successfully!")
      if (password) {
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
          localStorage.setItem('avatar_url', newUrl)
          localStorage.setItem('avatar_v', String(Date.now()))
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
        setImgSrc(fallbackImgSrc)
        setImagePreview(null)
        dispatch(mergeUser({ profilePicture: null, image: null }))
        dispatch(syncWithStorage())
        localStorage.removeItem('avatar_url')
        localStorage.setItem('avatar_v', String(Date.now()))
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
              maxWidth: { xs: '100%', sm: 900 },
              mx: { xs: 0, sm: 'auto' },
              background: "#1f1f1f",
              border: `1px solid ${themeColors.border}`,
            }}>
              <Stepper activeStep={step - 1} sx={{
                mb: 3,
                maxWidth: 900,
                mx: 'auto',
                '& .MuiStepIcon-root.Mui-active': { color: '#00a77f' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00a77f' },
                '& .MuiStepConnector-line': { borderTopWidth: '1px' },
                '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } }
              }}>
                {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff !important', fontWeight: 600, fontFamily: 'Woodford Bourne Pro', fontSize: '1rem', letterSpacing: .5, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff !important' }, '& .MuiStepLabel-label.Mui-completed': { color: '#fff !important' } }}>{label}</StepLabel></Step>)}
              </Stepper>
              <Box sx={{ width: '100%', height: 3, background: '#fff', mx: 0, mb: 3, opacity: 0.4 }} />

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'stretch' }, gap: 1.5, width: '100%', height: { xs: 'auto', sm: 180 } }}>
                <Avatar
                  src={imgSrc}
                  alt="Profile"
                  imgProps={{
                    onError: () => setImgSrc(fallbackImgSrc),
                    referrerPolicy: 'no-referrer',
                    crossOrigin: 'anonymous'
                  }}
                  sx={{
                    width: { xs: 112, sm: 115 },
                    height: { xs: 152, sm: 160 },
                    border: `3px solid ${themeColors.primary}`,
                    borderRadius: 3,
                    background: "#2f3033",
                    boxShadow: "0 4px 18px -4px rgba(0,0,0,0.6)"
                  }}
                >
                  <Person sx={{ fontSize: 62, color: themeColors.textFaint }} />
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
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
                  size="small"
                  onClick={() => router.push('/home')}
                  startIcon={<ArrowBack />}
                  sx={{
                    background: themeColors.primaryGradient,
                    fontWeight: 700,
                    px: 2.4,
                    width: { xs: '48%', sm: 'auto' },
                    borderRadius: 1,
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
                    width: { xs: '48%', sm: 'auto' },
                    borderRadius: 1,
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
              <Stepper activeStep={step - 1} sx={{
                mb: 1.5,
                maxWidth: 700,
                mx: 'auto',
                '& .MuiStepIcon-root.Mui-active': { color: '#00a77f' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00a77f' },
                '& .MuiStepConnector-line': { borderTopWidth: '1px' },
                '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } }
              }}>
                {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff !important', fontWeight: 600, fontFamily: 'Woodford Bourne Pro', fontSize: '1rem', letterSpacing: .5, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff !important' }, '& .MuiStepLabel-label.Mui-completed': { color: '#fff !important' } }}>{label}</StepLabel></Step>)}
              </Stepper>
              <Box sx={{ width: '100%', height: 2, background: '#fff', mx: 0, mb: 3, opacity: 0.80 }} />

              <Typography variant="h5" fontWeight={600} align="center" sx={{
                mb: 2,
                color: '#fff',
                letterSpacing: .5,
                fontFamily: 'Woodford Bourne Pro',
                fontSize: { xs: '1.2rem', sm: '1.75rem' },
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}>
                <AccountCircle sx={{ mr: 1, verticalAlign: 'middle', color: themeColors.primary, fontSize: 36, position: 'relative', top: -6 }} /> BASIC INFORMATION
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
                      src={imagePreview || imgSrc}
                      alt="Profile"
                      imgProps={{
                        onError: () => setImgSrc(fallbackImgSrc),
                        crossOrigin: 'anonymous'
                      }}
                      sx={{
                        width: { xs: 120, sm: 140, md: 170 },
                        height: { xs: 120, sm: 140, md: 170 },
                        borderRadius: '50%',
                        background: "#2c2e32",
                        cursor: 'pointer'
                      }}
                    >
                      <Person sx={{ fontSize: 70, color: themeColors.textFaint }} />
                    </Avatar>
                    {/* Hidden file input for gallery */}
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </Box>
                  <Typography sx={{ mt: 1.5, fontWeight: 400, fontSize: { xs: 16, sm: 20 }, color: '#fff', fontFamily: 'Woodford Bourne Pro', textAlign: 'center' }}>
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
                        inputProps={{ minLength: 6, maxLength: 16 }}
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
                              value={country}
                              select
                              onChange={e => {
                                setCountry(e.target.value)
                                setStateProvince("")
                                setCity("")
                              }}
                              placeholder="Select country"
                              fullWidth
                              sx={{ mb: 1, '& .MuiSelect-icon': { color: '#fff' } }}
                              SelectProps={{ MenuProps: selectMenuProps }}
                            >
                              {countryOptions.map(c => (
                                <MenuItem key={c} value={c}>{c}</MenuItem>
                              ))}
                            </StyledTextField>
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>City/State</Typography>
                            {country && countryCityMap[country] ? (
                              <StyledTextField
                                size="small"
                                value={city}
                                select
                                onChange={e => {
                                  const v = e.target.value
                                  setCity(v)
                                  setStateProvince(v)
                                }}
                                placeholder="Select city"
                                fullWidth
                                sx={{ mb: 1, '& .MuiSelect-icon': { color: '#fff' } }}
                                SelectProps={{ MenuProps: selectMenuProps }}
                              >
                                {countryCityMap[country].map(c => (
                                  <MenuItem key={c} value={c}>{c}</MenuItem>
                                ))}
                              </StyledTextField>
                            ) : (
                              <StyledTextField
                                size="small"
                                value={city}
                                onChange={e => {
                                  const v = e.target.value
                                  setCity(v)
                                  setStateProvince(v)
                                }}
                                placeholder={country ? "Type your city" : "Select country first"}
                                fullWidth
                                sx={{ mb: 1 }}
                              />
                            )}
                          </Grid>
                          <Grid item xs={6} sm={6}>
                            <Typography sx={{ mb: 0.5, fontSize: { xs: 15, sm: 20 }, fontWeight: 400, color: themeColors.text }}>Phone Number</Typography>
                            <StyledTextField
                              size="small"
                              type="tel"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              placeholder="+44 7911 123456"
                              fullWidth
                              inputProps={{ maxLength: 20 }}
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
                                      justifyContent: 'center',
                                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                      gap: 2,
                                      '& .MuiFormControlLabel-root': { m: 0 },
                                      '& .MuiFormControlLabel-label': { fontSize: 13, color: themeColors.textDim, letterSpacing: .2 }
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
                                      justifyContent: 'center',
                                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                      gap: 2,
                                      '& .MuiFormControlLabel-root': { m: 0 },
                                      '& .MuiFormControlLabel-label': { fontSize: 13, color: themeColors.textDim, letterSpacing: .2 }
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
                      <RadioGroup value={positionType} onChange={e => setPositionType(e.target.value)} row sx={{ justifyContent: { xs: 'flex-start', sm: 'space-between' }, px: { xs: 1, sm: 4 }, gap: { xs: 1, sm: 0 }, flexWrap: 'wrap' }}>
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

              <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 4, px: { xs: 1.25, sm: 3, md: 6 } }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 1,
                    px: 3,
                    width: { xs: '48%', sm: 'auto' },
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
                    borderRadius: 1,
                    px: 3,
                    width: { xs: '48%', sm: 'auto' },
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
                  {imgSrc && imgSrc !== fallbackImgSrc && (
                    <Button
                      variant="outlined"
                      onClick={handleDeleteProfilePicture}
                      disabled={isUpdating}
                      sx={{ textTransform: 'none', fontWeight: 700, borderColor: themeColors.danger, color: themeColors.danger, '&:hover': { background: 'rgba(211,47,47,0.1)', borderColor: themeColors.danger } }}
                    >
                      Delete image
                    </Button>
                  )}
                </Stack>
              </Box>
            </Modal>

            {/* Camera Modal */}
            <Modal open={cameraOpen} onClose={handleCloseCamera}>
              <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                bgcolor: '#1f1f1f', color: '#fff', p: 2, borderRadius: 2, width: 'min(460px, 92vw)', maxWidth: '92vw',
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
              <Stepper activeStep={step - 1} sx={{
                mb: 1.5,
                maxWidth: 700,
                mx: 'auto',
                '& .MuiStepIcon-root.Mui-active': { color: '#00a77f' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#00a77f' },
                '& .MuiStepConnector-line': { borderTopWidth: '1px' },
                '& .MuiStepLabel-label': { display: { xs: 'none', sm: 'block' } }
              }}>
                {steps.map(label => <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: '#fff !important', fontWeight: 600, fontFamily: 'Woodford Bourne Pro', fontSize: '1rem', letterSpacing: .5, textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fff !important' }, '& .MuiStepLabel-label.Mui-completed': { color: '#fff !important' } }}>{label}</StepLabel></Step>)}
              </Stepper>
              <Box sx={{ width: '100%', height: 2, background: '#fff', mx: 0, mb: 3, opacity: 0.80 }} />

              <Typography variant="h5" fontWeight={600} align="center" sx={{
                mb: 2,
                color: '#fff',
                letterSpacing: .5,
                fontFamily: 'Woodford Bourne Pro',
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

              <form onSubmit={handleUpdateProfile} style={{ width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mt: 5, px: { xs: 1, sm: 3, md: 6 } }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteProfile}
                    sx={{
                      borderRadius: 1,
                      px: 4,
                      width: { xs: '48%', sm: 'auto' },
                      fontWeight: 600,
                      borderColor: '#00a77f',
                      color: themeColors.text,
                      '&:hover': { background: "rgba(0,167,127,0.15)", borderColor: '#00a77f' }
                    }}
                  >Delete Account</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isUpdating}
                    startIcon={isUpdating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
                    sx={{
                      borderRadius: 1,
                      px: 5,
                      width: { xs: '48%', sm: 'auto' },
                      fontWeight: 700,
                      background: themeColors.primaryGradient,
                      '&:hover': { opacity: .9 }
                    }}
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </Stack>
              </form>

              <Stack direction="row" justifyContent="flex-start" sx={{ mt: 4, px: { xs: 1, sm: 3, md: 6 } }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderRadius: 1,
                    px: 3,
                    width: 'auto',
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
