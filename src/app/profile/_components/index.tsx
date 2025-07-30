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

// Styled components for better design
const StyledPaper = styled(Paper)(({ }) => ({
  background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
  borderRadius: 20,
  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
  backdropFilter: "blur(10px)",
}))

const SkillCard = styled(Card)(({ }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  borderRadius: 15,
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
}))

const StyledSlider = styled(Slider)(({ }) => ({
  "& .MuiSlider-thumb": {
    width: 24,
    height: 24,
    backgroundColor: "#fff",
    border: "3px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
    },
  },
  "& .MuiSlider-track": {
    height: 8,
    borderRadius: 4,
  },
  "& .MuiSlider-rail": {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
}))

// Styled TextField for green bg and white text
const StyledTextField = styled(TextField)(({ }) => ({
  '& .MuiOutlinedInput-root': {
    background: '#1f673b',
    color: 'white',
    borderRadius: 8,
    border: '1.5px solid #43a047',
    '& fieldset': {
      borderColor: '#43a047',
    },
    '&:hover fieldset': {
      borderColor: '#388e3c',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#43a047',
    },
    '&.Mui-focused': {
      background: '#1f673b',
    },
    // Make sure the input itself is always green and text is white
    '& input': {
      color: '#fff',
      background: '#1f673b',
      caretColor: '#fff',
    },
    '& textarea': {
      color: '#fff',
      background: '#1f673b',
      caretColor: '#fff',
    },
    // Custom selection color for input and textarea
    '& input::selection, & textarea::selection': {
      background: '#1f673b',
      color: '#fff',
    },
  },
  '& label': {
    color: '#fff',
  },
  '& .MuiInputLabel-root': {
    color: '#fff',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#fff',
  },
  '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
  WebkitAppearance: 'none',
  margin: 0,
},
'& input[type=number]': {
  MozAppearance: 'textfield',
  appearance: 'textfield',
},
}))

// Styled Radio for green accent and white label
const StyledRadio = styled(Radio)(({ }) => ({
  color: '#43a047',
  '&.Mui-checked': {
    color: '#43a047',
  },
}))

// Styled FormLabel for white text
const StyledFormLabel = styled(FormLabel)(() => ({
  color: '#fff',
  fontWeight: 'bold',
}))

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
  const [imgSrc, setImgSrc] = useState(user?.profilePicture || "/assets/group451.png?height=120&width=120")

  const router = useRouter()

  const steps = ["Profile Overview", "Basic Info", "Skills & Stats"]

  useEffect(() => {
    setImgSrc(user?.profilePicture || "/assets/group451.png?height=120&width=120")
  }, [user?.profilePicture])

  useEffect(() => {
    if (user?.position) {
      const currentPosition = user.position
      if (currentPosition.includes("Goalkeeper")) {
        setPositionType("Goalkeeper")
        setPosition(currentPosition)
      } else if (currentPosition.includes("Back") || currentPosition.includes("Wing-back")) {
        setPositionType("Defender")
        setPosition(currentPosition)
      } else if (currentPosition.includes("Midfielder")) {
        setPositionType("Midfielder")
        setPosition(currentPosition)
      } else if (
        currentPosition.includes("Forward") ||
        currentPosition.includes("Striker") ||
        currentPosition.includes("Winger")
      ) {
        setPositionType("Forward")
        setPosition(currentPosition)
      } else {
        setPositionType("Goalkeeper")
        setPosition("Goalkeeper (GK)")
      }
    } else {
      setPositionType("Goalkeeper")
      setPosition("Goalkeeper (GK)")
    }
  }, [user?.position])



  const handleNext = () => {
    setStep((prev) => prev + 1)
  }

  const handlePrevious = () => {
    setStep((prev) => (prev > 1 ? prev - 1 : prev))
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setIsUpdating(true)
      setError("")
      if (!isAuthenticated || !token) {
        throw new Error("Not authenticated. Please login again.")
      }

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
          physical: physical ?? 50,
        },
        ...(password && { password }),
      }

      const { ok, data } = await updateProfile(token, updateData)
      if (!ok) {
        throw new Error(data.message || "Failed to update profile")
      }
      
      // Update cache with new user data
      if (data.user) {
        cacheManager.updatePlayersCache(data.user);
      }
      
      toast.success("Profile updated successfully!")
      router.push("/home")
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Failed to update profile. Please try again.")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!token) return
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return
    const ok = await deleteProfile(token)
    if (ok) {
      localStorage.clear()
      window.location.href = "/"
    } else {
      toast.error("Failed to delete account. Please try again.")
    }
  }

  const getSkillLabel = (value: number) => {
    if (value >= 80) return { text: `${value} Elite`, color: "#f44336" }
    if (value >= 70) return { text: `${value} Professional`, color: "#2196f3" }
    return { text: `${value} Amateur`, color: "#4caf50" }
  }

  const getSkillColor = (value: number) => {
    if (value >= 80) return "#f44336"
    if (value >= 70) return "#ff9800"
    return "#4caf50"
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
      body: formData,
    })
    const data = await res.json()
    if (data.success) {
      // Update cache with new user data
      if (data.user) {
        cacheManager.updatePlayersCache(data.user);
      }
      toast.success("Profile picture updated!")
      window.location.reload()
    } else {
      toast.error("Failed to upload image")
    }
  }

  // Step 1: Profile Overview
  if (step === 1) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <Fade in timeout={800}>
          <Box>
            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <StyledPaper elevation={4} sx={{
              p: 1.5,
              border: `2px solid #4CAF50`,
              background: '#1f673b',
              borderRadius: 4,
              maxWidth: 350,
              mx: 'auto',
              boxShadow: '0 4px 24px 0 rgba(67,160,71,0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* Personal Info left, Image right */}
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', height: 180 }}>
                <Avatar
                  src={imgSrc}
                  alt="Profile"
                  sx={{
                    width: 110,
                    height: 150,
                    border: '4px solid green',
                    borderRadius: 2,
                    background: '#fff',
                    boxShadow: 'none',
                    objectFit: 'cover'
                  }}
                >
                  <Person sx={{ fontSize: 60, color: '#111' }} />
                </Avatar>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    height: '100%',
                    flex: 1,
                    ml: 1
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Player Name"}
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
                    Age: <span>{user?.age || "18"}</span>
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>Email:</span>
                    <span style={{ fontWeight: 700 }}>{user?.email || "email@example.com"}</span>
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
                    Shirt: <span >{user?.shirtNumber || "00"}</span>
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
                    Preferred <span>Foot:</span> <span>{user?.preferredFoot || "Right"}</span>
                  </Typography>
                  <Chip
                    label={positionType || "Position"}
                    color="primary"
                    sx={{
                      fontSize: '1rem',
                      px: 2,
                      py: 0.5,
                      background: '#43a047',
                      color: '#fff',
                      fontWeight: 700,
                      border: '2px solid #fff',
                      // alignSelf: 'center'
                    }}
                  />
                </Box>
              </Box>

              <Card
                sx={{
                  width: '100%',
                  maxWidth: 320,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  borderRadius: 3,
                  mx: 'auto',
                  mb: 2,
                  mt: 2
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, color: '#fff', fontWeight: 600, fontSize: 18 }}>
                    <Sports /> Skills Overview
                  </Typography>
                  <Stack spacing={1.2}>
                    {[
                      { name: "Dribbling", value: dribbling },
                      { name: "Shooting", value: shooting },
                      { name: "Passing", value: passing },
                      { name: "Pace", value: pace },
                      { name: "Defending", value: defending },
                      { name: "Physical", value: physical },
                    ].map((skill) => (
                      <Box key={skill.name}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="body2" sx={{ color: '#fff' }}>{skill.name}</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>
                            {skill.value}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={skill.value}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "rgba(255,255,255,0.3)",
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: "#fff",
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button
                  variant="contained"
                  size="large"
                  onClick={()=>router.push('/home')}
                  startIcon={<ArrowBack />}
                  sx={{
                    background: "#43a047",
                    borderRadius: 25,
                    px: 2,
                    py: 1,
                    fontSize: "1.1rem",
                    textTransform: "none",
                    color: '#fff',
                    '&:hover': { bgcolor: '#1f673b' },
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                  }}
                >
                  Home
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: "#43a047",
                    borderRadius: 25,
                    px: 2,
                    py: 1,
                    fontSize: "1.1rem",
                    textTransform: "none",
                    color: '#fff',
                    '&:hover': { bgcolor: '#1f673b' },
                    boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                  }}
                >
                  Edit Profile
                </Button>
              </Box>
            </StyledPaper>
          </Box>
        </Fade>
        {(
          <style>{`
            .profile-autofill input:-webkit-autofill,
            .profile-autofill input:-webkit-autofill:focus,
            .profile-autofill input:-webkit-autofill:hover,
            .profile-autofill input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 1000px #1f673b inset !important;
              box-shadow: 0 0 0 1000px #1f673b inset !important;
              -webkit-text-fill-color: #fff !important;
              color: #fff !important;
              caret-color: #fff !important;
            }
          `}</style>
        )}
      </Container>
    )
  }

  // Step 2: Basic Info
  if (step === 2) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in timeout={800}>
          <Box>
            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <StyledPaper elevation={0} sx={{ p: 4, background: '#1f673b', color: 'white' }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                align="center"
                sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: '#fff' }}
              >
                <AccountCircle color="primary" /> Basic Information
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 4,
                  mb: 4,
                  flexDirection: { xs: 'column', md: 'row' },
                }}
              >
                {/* Profile Image Left (on mobile: top center) */}
                <Box
                  sx={{
                    minWidth: { xs: 0, md: 140 },
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: '100%', md: 'auto' },
                    mb: { xs: 2, md: 0 },
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                          src={imagePreview || imgSrc}
                          alt="Profile"
                          sx={{
                            width: { xs: 110, sm: 130, md: 150 },
                            height: { xs: 130, sm: 160, md: 215 },
                            border: '4px solid green',
                            borderRadius: 2,
                            background: '#fff',
                            boxShadow: 'none',
                            objectFit: 'cover',
                            mx: 'auto',
                          }}
                        >
                          <Person sx={{ fontSize: 60, color: '#111' }} />
                        </Avatar>
                        <IconButton
                          component="label"
                          sx={{
                            position: 'absolute',
                            top: -10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: '#43a047',
                            color: 'white',
                            '&:hover': { bgcolor: '#1f673b' },
                            boxShadow: 3,
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            border: '3px solid #fff',
                            ml: 8,
                          }}
                        >
                          <Edit sx={{ fontSize: 20 }} />
                          <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                        </IconButton>
                      </Box>
                      {imageFile && (
                        <Button
                          variant="contained"
                          onClick={handleUploadImage}
                          sx={{
                            mt: 3,
                            borderRadius: 20,
                            bgcolor: '#43a047',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 10,
                            px: 4,
                            py: 1.5,
                            '&:hover': { bgcolor: '#1f673b' },
                          }}
                          fullWidth={false}
                        >
                          UPLOAD IMAGE
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
                {/* Fields Right (on mobile: below image) */}
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        className="profile-autofill"
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        className="profile-autofill"
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    {/* Email and Password side by side */}
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        className="profile-autofill"
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        className="profile-autofill"
                        label="Change Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff sx={{ color: '#fff' }} /> : <Visibility sx={{ color: '#fff' }} />}
                            </IconButton>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid container spacing={2} mt={1} ml={0.5} alignItems="flex-start">
                      {/* Top Row: Shirt Number and Age (always on top) */}
                      <Grid item xs={6} sm={2}>
                        <StyledTextField
                          className="profile-autofill"
                          label="Shirt Number"
                          type="number"
                          value={shirtNumber}
                          onChange={(e) => setShirtNumber(e.target.value)}
                          fullWidth
                          variant="outlined"
                          InputProps={{ sx: { height: 70, borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <StyledTextField
                          className="profile-autofill"
                          label="Age"
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          fullWidth
                          variant="outlined"
                          InputProps={{ sx: { height: 70 } }}
                        />
                      </Grid>
                      
                      {/* Bottom Row: Gender and Preferred Foot (move below on small screens) */}
                      <Grid item xs={12} sm={4} sx={{ 
                        order: { xs: 3, sm: 3 },
                        mt: { xs: 2, sm: 0 }
                      }}>
                        {/* Gender field */}
                        <Card sx={{ p: 2, backgroundColor: '#1f673b', borderRadius: 3, border: '2px solid #43a047' }}>
                          <FormControl component="fieldset">
                            <StyledFormLabel sx={{ color: '#fff !important', mt: -2 }} >
                              Gender
                            </StyledFormLabel>
                            <RadioGroup
                              sx={{
                                display: 'flex',
                                flexDirection: 'row !important',
                                justifyContent: 'space-between',
                                width: '100%',
                                position: 'relative',
                                mb: -2
                              }}
                              value={gender} onChange={(e) => setGender(e.target.value)} row>
                              <FormControlLabel sx={{ flex: 1, justifyContent: 'flex-start' }} value="male" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Male</span>} />
                              <FormControlLabel sx={{ flex: 1, justifyContent: 'flex-end', mt: 0, position: 'absolute', ml: 8 }} value="female" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Female</span>} />
                            </RadioGroup>
                          </FormControl>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ 
                        order: { xs: 4, sm: 4 },
                        mt: { xs: 2, sm: 0 }
                      }}>
                        {/* Preferred Foot field */}
                        <Card sx={{ p: 2, backgroundColor: '#1f673b', border: '2px solid #43a047', borderRadius: 3 }}>
                          <FormControl component="fieldset">
                            <StyledFormLabel sx={{ color: '#fff !important', textAlign: 'center', width: '100%', mt: -2 }}>
                              Preferred Foot
                            </StyledFormLabel>
                            <RadioGroup
                              row
                              value={preferredFoot}
                              onChange={(e) => setPreferredFoot(e.target.value)}
                              sx={{
                                display: 'flex',
                                flexDirection: 'row !important',
                                justifyContent: 'space-between',
                                width: '100%',
                                position: 'relative',
                                mb: -2
                              }}
                            >
                              <FormControlLabel
                                value="Left"
                                control={<StyledRadio />}
                                label={<span style={{ color: '#fff' }}>Left</span>}
                                sx={{ flex: 1, justifyContent: 'flex-start' }}
                              />
                              <FormControlLabel
                                value="Right"
                                control={<StyledRadio />}
                                label={<span style={{ color: '#fff' }}>Right</span>}
                                sx={{ flex: 1, justifyContent: 'flex-end', mt: 0, position: 'absolute', ml: 10 }}
                              />
                            </RadioGroup>
                          </FormControl>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
              {/* Rest of Step 2 fields (Position, Style, etc.) */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1, color: '#fff !important' }}>
                        Position Type
                      </StyledFormLabel>
                      <RadioGroup value={positionType} onChange={(e) => setPositionType(e.target.value)} row>
                        {["Goalkeeper", "Defender", "Midfielder", "Forward"].map((type) => (
                          <FormControlLabel
                            key={type}
                            value={type}
                            control={<StyledRadio />}
                            label={<span style={{ color: '#fff' }}>{type}</span>}
                            sx={{ mr: 3 }}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ p: { xs: 1.2, sm: 2 }, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, mb: { xs: 2, sm: 0 } }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1, color: '#fff !important', fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                        Specific Position
                      </StyledFormLabel>
                      <RadioGroup value={position} onChange={(e) => setPosition(e.target.value)}>
                        {positionType === "Goalkeeper" && (
                          <FormControlLabel
                            value="Goalkeeper (GK)"
                            control={<StyledRadio />}
                            label={<span style={{ color: '#fff', fontSize: '1rem' }}>{'Goalkeeper (GK)'}</span>}
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }}
                          />
                        )}
                        {positionType === "Defender" && (
                          <>
                            <FormControlLabel value="Center-Back (CB)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Center-Back (CB)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Right-Back (RB)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Right-Back (RB)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Left-Back (LB)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Left-Back (LB)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Right Wing-back (RWB)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Right Wing-back (RWB)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Left Wing-back (LWB)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Left Wing-back (LWB)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                          </>
                        )}
                        {positionType === "Midfielder" && (
                          <>
                            <FormControlLabel value="Central Midfielder (CM)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Central Midfielder (CM)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Defensive Midfielder (CDM)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Defensive Midfielder (CDM)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Attacking Midfielder (CAM)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Attacking Midfielder (CAM)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Right Midfielder (RM)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Right Midfielder (RM)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Left Midfielder (LM)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Left Midfielder (LM)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                          </>
                        )}
                        {positionType === "Forward" && (
                          <>
                            <FormControlLabel value="Striker (ST)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Striker (ST)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Central Forward (CF)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Central Forward (CF)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Right Forward (RF)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Right Forward (RF)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Left Forward (LF)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Left Forward (LF)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Right Winger (RW)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Right Winger (RW)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                            <FormControlLabel value="Left Winger (LW)" control={<StyledRadio />} label={<span style={{ color: '#fff', fontSize: '1rem' }}>Left Winger (LW)</span>} sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }} />
                          </>
                        )}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ p: { xs: 1.2, sm: 2 }, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1, color: '#fff !important', fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                        Playing Style
                      </StyledFormLabel>
                      <RadioGroup value={style} onChange={(e) => setStyle(e.target.value)}>
                        {["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Sweeper Keeper"].map((s) => (
                          <FormControlLabel
                            key={s}
                            value={s}
                            control={<StyledRadio />}
                            label={<span style={{ color: '#fff', fontSize: '1rem' }}>{s}</span>}
                            sx={{ '& .MuiFormControlLabel-label': { fontSize: { xs: '0.95rem', sm: '1rem' } } }}
                          />
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
                  sx={{ borderRadius: 20, px: 3, color: '#fff', borderColor: '#43a047', '&:hover': { bgcolor: '#1f673b', borderColor: '#1f673b' } }}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{ borderRadius: 20, px: 3, bgcolor: '#43a047', color: '#fff', '&:hover': { bgcolor: '#1f673b' } }}
                >
                  Next
                </Button>
              </Stack>
            </StyledPaper>
          </Box>
        </Fade>
        {(
          <style>{`
            .profile-autofill input:-webkit-autofill,
            .profile-autofill input:-webkit-autofill:focus,
            .profile-autofill input:-webkit-autofill:hover,
            .profile-autofill input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 1000px #1f673b inset !important;
              box-shadow: 0 0 0 1000px #1f673b inset !important;
              -webkit-text-fill-color: #fff !important;
              color: #fff !important;
              caret-color: #fff !important;
            }
          `}</style>
        )}
      </Container>
    )
  }

  // Step 3: Skills
  if (step === 3) {
    const skills = [
      { name: "Dribbling", value: dribbling, setter: setDribbling, icon: "⚽" },
      { name: "Shooting", value: shooting, setter: setShooting, icon: "🎯" },
      { name: "Passing", value: passing, setter: setPassing, icon: "🎪" },
      { name: "Pace", value: pace, setter: setPace, icon: "💨" },
      { name: "Defending", value: defending, setter: setDefending, icon: "🛡️" },
      { name: "Physical", value: physical, setter: setPhysical, icon: "💪" },
    ]

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Fade in timeout={800}>
          <Box>
            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <StyledPaper elevation={0} sx={{ p: 4, background: '#1f673b', color: 'white' }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                align="center"
                sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: '#fff', letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
              >
                <Sports color="primary" /> Skills & Attributes
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {skills.map((skill) => (
                  <Grid item xs={12} sm={6} key={skill.name}>
                    <SkillCard
                      sx={{
                        background: 'linear-gradient(135deg, #1f673b 0%, #1f673b 100%)',
                        color: '#fff',
                        borderRadius: 4,
                        boxShadow: '0 8px 32px 0 rgba(67,160,71,0.18)',
                        border: '1.5px solid rgba(67,160,71,0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'scale(1.025)',
                          boxShadow: '0 12px 40px 0 rgba(67,160,71,0.28)',
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold', letterSpacing: 0.5, textShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>{skill.icon}</Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', letterSpacing: 0.5, textShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
                            {skill.name}
                          </Typography>
                        </Box>
                        <StyledSlider
                          value={skill.value ?? 50}
                          onChange={(e, value) => skill.setter(value as number)}
                          min={50}
                          max={99}
                          step={1}
                          sx={{
                            "& .MuiSlider-thumb": {
                              backgroundColor: getSkillColor(skill.value ?? 50),
                            },
                            "& .MuiSlider-track": {
                              backgroundColor: getSkillColor(skill.value ?? 50),
                            },
                          }}
                        />
                        <Box sx={{ textAlign: "center", mt: 1 }}>
                          <Chip
                            label={getSkillLabel(skill.value ?? 50).text}
                            sx={{
                              backgroundColor: getSkillLabel(skill.value ?? 50).color,
                              color: "white",
                              fontWeight: "bold",
                              fontSize: '1rem',
                              px: 2,
                              boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)',
                              border: '1.5px solid #fff',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </SkillCard>
                  </Grid>
                ))}
              </Grid>

              {/* Update & Delete Account Buttons */}
              <form onSubmit={handleUpdateProfile} style={{ width: '100%' }}>
                <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 5 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeleteProfile}
                    sx={{ borderRadius: 20, px: 4, color: '#fff', borderColor: '#f44336', '&:hover': { bgcolor: '#b71c1c', borderColor: '#b71c1c' }, fontWeight: 600 }}
                  >
                    Delete Account
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isUpdating}
                    startIcon={isUpdating ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : null}
                    sx={{
                      borderRadius: 20,
                      px: 5,
                      bgcolor: '#43a047',
                      color: '#fff',
                      '&:hover': { bgcolor: '#1f673b' },
                      fontWeight: 600,
                      boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
                    }}
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </Stack>
              </form>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{ borderRadius: 20, px: 3, color: '#fff', borderColor: '#43a047', '&:hover': { bgcolor: '#1f673b', borderColor: '#1f673b' }, boxShadow: '0 2px 8px 0 rgba(67,160,71,0.12)' }}
                >
                  Previous
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
