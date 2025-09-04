"use client"
import { useAuth } from "@/lib/hooks"
import type React from "react"
import { useState, useEffect } from "react"
import { Edit, Person, Sports, AccountCircle } from "@mui/icons-material"
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
} from "@mui/material"
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
  "& .MuiSlider-track": {
    border: "none",
    background: themeColors.sliderTrack
  },
  "& .MuiSlider-rail": {
    opacity: 0.25,
    background: "#555"
  },
  "& .MuiSlider-thumb": {
    width: 22,
    height: 22,
    background: "#fff",
    border: `3px solid ${themeColors.primary}`,
    boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(229,106,22,0.2)"
    },
    "&:focus-visible": {
      boxShadow: "0 0 0 10px rgba(229,106,22,0.25)"
    }
  }
}))

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    background: "#202225",
    color: themeColors.text,
    borderRadius: 10,
    border: `1px solid ${themeColors.border}`,
    transition: ".25s",
    '& fieldset': {
      borderColor: "transparent"
    },
    '&:hover': {
      borderColor: themeColors.borderStrong
    },
    '&:hover fieldset': {
      borderColor: themeColors.primary
    },
    '&.Mui-focused': {
      borderColor: themeColors.primary
    },
    '&.Mui-focused fieldset': {
      borderColor: themeColors.primary
    },
    '& input, & textarea': {
      color: themeColors.text,
      background: "transparent"
    },
    '& input::selection, & textarea::selection': {
      background: themeColors.primaryAlt,
      color: "#fff"
    }
  },
  '& .MuiInputLabel-root': {
    color: themeColors.textDim
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: themeColors.primary
  },
  '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0
  },
  '& input[type=number]': {
    MozAppearance: 'textfield',
    appearance: 'textfield'
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
  const [shirtNumber, setShirtNumber] = useState(user?.shirtNumber || "00")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [showPassword, setShowPassword] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fallbackImgSrc = (imgicon as StaticImageData).src
  const safeSrc = (v: unknown) => typeof v === "string" && v.trim().length ? v : fallbackImgSrc
  const [imgSrc, setImgSrc] = useState<string>(safeSrc(user?.profilePicture))
  const router = useRouter()
  const steps = ["Profile Overview", "Basic Info", "Skills & Stats"]

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

  const handleNext = () => setStep(s => s + 1)
  const handlePrevious = () => setStep(s => s > 1 ? s - 1 : s)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setIsUpdating(true)
      setError("")
      if (!isAuthenticated || !token) throw new Error("Not authenticated. Please login again.")

      const updateData = {
        firstName,
        lastName,
        email,
        age: age ? Number(age) : undefined,
        gender,
        position,
        positionType,
        style,
        preferredFoot,
        shirtNumber,
        skills: {
          dribbling: dribbling ?? 50,
          shooting: shooting ?? 50,
          passing: passing ?? 50,
          pace: pace ?? 50,
          defending: defending ?? 50,
          physical: physical ?? 50
        },
        ...(password && { password })
      }

      const { ok, data } = await updateProfile(token, updateData)
      if (!ok) throw new Error(data.message || "Failed to update profile")
      if (data.user) cacheManager.updatePlayersCache(data.user)
      toast.success("Profile updated successfully!")
      router.push("/home")
    } catch (err: unknown) {
      // err typed as unknown; safely extract message
      setError(getErrorMessage(err))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!token) return
    if (!window.confirm("Delete account permanently?")) return
    const ok = await deleteProfile(token)
    if (ok) {
      localStorage.clear()
      window.location.href = "/"
    } else toast.error("Failed to delete account.")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0])
      setImagePreview(URL.createObjectURL(e.target.files[0]))
    }
  }
  const handleUploadImage = async () => {
    if (!imageFile || !token) return
    const formData = new FormData()
    formData.append("profilePicture", imageFile)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      if (data.user) cacheManager.updatePlayersCache(data.user)
      toast.success("Profile picture updated!")
      window.location.reload()
    } else toast.error("Upload failed")
  }

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
                  <Typography sx={{ fontSize: 13, color: themeColors.textDim }}>Shirt: <b style={{ color: themeColors.text }}>{user?.shirtNumber || "00"}</b></Typography>
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
              p: 4,
              background: "linear-gradient(145deg,#202226 0%,#27292d 60%)",
              borderRadius: 6
            }}>
              <Typography variant="h5" fontWeight={800} align="center" sx={{
                mb: 4,
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
                mb: 4,
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
                      src={imagePreview || imgSrc}
                      alt="Profile"
                      imgProps={{
                        onError: () => setImgSrc(fallbackImgSrc),
                        crossOrigin: 'anonymous'
                      }}
                      sx={{
                        width: { xs: 120, sm: 140, md: 170 },
                        height: { xs: 150, sm: 185, md: 230 },
                        border: `3px solid ${themeColors.primary}`,
                        borderRadius: 4,
                        background: "#2c2e32"
                      }}
                    >
                      <Person sx={{ fontSize: 70, color: themeColors.textFaint }} />
                    </Avatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: themeColors.primaryGradient,
                        color: '#fff',
                        width: 34,
                        height: 34,
                        border: '2px solid #fff',
                        boxShadow: "0 6px 18px -6px rgba(0,0,0,0.65)",
                        '&:hover': { opacity: .9 }
                      }}
                    >
                      <Edit fontSize="small" />
                      <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </IconButton>
                  </Box>
                  {imageFile && (
                    <Button
                      variant="contained"
                      onClick={handleUploadImage}
                      sx={{
                        mt: 3,
                        fontWeight: 700,
                        background: themeColors.primaryGradient,
                        borderRadius: 3,
                        px: 3,
                        '&:hover': { opacity: .9 }
                      }}
                    >Upload Image</Button>
                  )}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
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

                    <Grid container spacing={2} mt={1} ml={0.2}>
                      <Grid item xs={6} sm={2}>
                        <StyledTextField label="Shirt #" type="number" value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} fullWidth />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <StyledTextField label="Age" type="number" value={age} onChange={e => setAge(e.target.value)} fullWidth />
                      </Grid>

                      <Grid item xs={12} sm={4} sx={{ mt: { xs: 2, sm: 0 } }}>
                        <Card sx={{
                          p: 2,
                          background: "#222428",
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: 4
                        }}>
                          <FormControl component="fieldset">
                            <StyledFormLabel sx={{ mt: -1 }}>Gender</StyledFormLabel>
                            <RadioGroup
                              row
                              value={gender}
                              onChange={e => setGender(e.target.value)}
                              sx={{ justifyContent: 'space-between' }}
                            >
                              <FormControlLabel value="male" control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>Male</span>} />
                              <FormControlLabel value="female" control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>Female</span>} />
                            </RadioGroup>
                          </FormControl>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={4} sx={{ mt: { xs: 2, sm: 0 } }}>
                        <Card sx={{
                          p: 2,
                          background: "#222428",
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: 4
                        }}>
                          <FormControl component="fieldset">
                            <StyledFormLabel sx={{ mt: -1 }}>Preferred Foot</StyledFormLabel>
                            <RadioGroup
                              row
                              value={preferredFoot}
                              onChange={e => setPreferredFoot(e.target.value)}
                              sx={{ justifyContent: 'space-between' }}
                            >
                              <FormControlLabel value="Left" control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>Left</span>} />
                              <FormControlLabel value="Right" control={<StyledRadio />} label={<span style={{ color: themeColors.textDim }}>Right</span>} />
                            </RadioGroup>
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
                        {["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Sweeper Keeper"].map(s => (
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
                mb: 4,
                background: themeColors.primaryGradient,
                WebkitBackgroundClip: "text",
                color: "transparent",
                letterSpacing: .6
              }}>
                <Sports sx={{ mr: .75, color: themeColors.primary }} /> Skills & Attributes
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                {skills.map(skill => {
                  const labelInfo = getSkillLabel(skill.value ?? 50)
                  return (
                    <Grid item xs={12} sm={6} key={skill.name}>
                      <SkillCard>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
                            <Image src={skill.icon} alt="icon" width={42} height={42} />
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: themeColors.text, letterSpacing: .4 }}>
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
                                color: '#fff'
                              }}
                            />
                          </Box>
                          <Box mt="auto">
                            <StyledSlider
                              value={skill.value ?? 50}
                              onChange={(e, v) => skill.setter(v as number)}
                              min={50}
                              max={99}
                              step={1}
                            />
                            <Box sx={{ textAlign: "center", mt: 1.2 }}>
                              <Chip
                                label={labelInfo.text}
                                sx={{
                                  background: labelInfo.color,
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '.75rem',
                                  px: 2,
                                  borderRadius: 2,
                                  letterSpacing: .5
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
