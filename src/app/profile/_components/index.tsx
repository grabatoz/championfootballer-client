"use client"
import { useAuth } from "@/lib/hooks"
import type React from "react"
import { useState, useEffect } from "react"
import { Edit, Person, Sports, Settings, AccountCircle } from "@mui/icons-material"
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
  Alert,
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
  Zoom,
} from "@mui/material"
import { styled } from "@mui/material/styles"
import { updateProfile, deleteProfile } from "@/lib/api"
import { useRouter } from "next/navigation"

// Styled components for better design
const StyledPaper = styled(Paper)(({}) => ({
  background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
  borderRadius: 20,
  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
  backdropFilter: "blur(10px)",
}))

const ProfileAvatar = styled(Avatar)(({}) => ({
  width: 120,
  height: 120,
  border: "4px solid #fff",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  transition: "transform 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
}))

const SkillCard = styled(Card)(({}) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  borderRadius: 15,
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
}))

const StyledSlider = styled(Slider)(({  }) => ({
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
const StyledTextField = styled(TextField)(({}) => ({
  '& .MuiOutlinedInput-root': {
    background: '#1f673b',
    color: '#fff',
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
    '& input': {
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
}))

// Styled Radio for green accent and white label
const StyledRadio = styled(Radio)(({}) => ({
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
  const [dribbling, setDribbling] = useState(user?.skills?.dribbling )
  const [shooting, setShooting] = useState(user?.skills?.shooting )
  const [passing, setPassing] = useState(user?.skills?.passing )
  const [pace, setPace] = useState(user?.skills?.pace )
  const [defending, setDefending] = useState(user?.skills?.defending )
  const [physical, setPhysical] = useState(user?.skills?.physical)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string>("")
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [lastName, setLastName] = useState(user?.lastName || "")
  const [age, setAge] = useState(user?.age || "")
  const [gender, setGender] = useState(user?.gender || "")
  const [positionType, setPositionType] = useState(user?.positionType || "")
  const [position, setPosition] = useState(user?.position || "Goalkeeper (GK)")
  const [style, setStyle] = useState(user?.style || "")
  const [preferredFoot, setPreferredFoot] = useState(user?.preferredFoot || "Left")
  const [shirtNumber, setShirtNumber] = useState(user?.shirtNumber || "")
  const [password, setPassword] = useState(user?.password || "")
  const [email, setEmail] = useState(user?.email || "")
  const [showPassword, setShowPassword] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imgSrc, setImgSrc] = useState(user?.profilePicture || "/assets/group451.png?height=120&width=120")

  const router = useRouter()

  const steps = ["Profile Overview", "Basic Info", "Skills & Stats", "Account Settings"]

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

  useEffect(() => {
    if (positionType === "Goalkeeper") {
      setPosition("Goalkeeper (GK)")
    } else if (positionType === "Defender") {
      setPosition("Center-Back (CB)")
    } else if (positionType === "Midfielder") {
      setPosition("Central Midfielder (CM)")
    } else if (positionType === "Forward") {
      setPosition("Striker (ST)")
    }
  }, [positionType])

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
      alert("Profile updated successfully!")
      router.push("/dashboard")
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
      alert("Failed to delete account. Please try again.")
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
      alert("Profile picture updated!")
      window.location.reload()
    } else {
      alert("Failed to upload image")
    }
  }

  // Step 1: Profile Overview
  if (step === 1) {
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

            <StyledPaper elevation={4} sx={{ p: 4, border: `2px solid #4CAF50` , background:'#1f673b' }}>
              {/* Image + Personal Info side by side */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-start', mb: 4 }}>
                <Zoom in timeout={600}>
                  <ProfileAvatar src={imgSrc} alt="Profile">
                    <Person sx={{ fontSize: 60 }} />
                  </ProfileAvatar>
                </Zoom>
                <Box sx={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  p: 2.5,
                  minWidth: 220,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  boxShadow: '0 2px 8px 0 rgba(67,160,71,0.10)'
                }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: '#fff', letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Player Name"}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                    <b>Age:</b> {user?.age || "18"}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                    <b>Email:</b> {user?.email || "email@example.com"}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                    <b>Shirt No:</b> {user?.shirtNumber || "00"}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                    <b>Preferred Foot:</b> {user?.preferredFoot || "Right"}
                  </Typography>
                  <Chip
                    label={positionType || "Position"}
                    color="primary"
                    sx={{ fontSize: '1rem', px: 2, py: 1, background: '#43a047', color: 'white', fontWeight: 700, boxShadow: '0 2px 8px 0 rgba(67,160,71,0.18)', border: '1.5px solid #fff', mt: 1 }}
                  />
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
                  <Card
                    sx={{
                      height: "100%",
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      borderRadius: 3,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, color: '#fff' }}>
                        <Sports /> Skills Overview
                      </Typography>
                      <Stack spacing={2}>
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
                </Grid>
              </Grid>

              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: "#43a047",
                    borderRadius: 25,
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    textTransform: "none",
                    color: '#fff',
                    '&:hover': { bgcolor: '#388e3c' },
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

            <StyledPaper elevation={0} sx={{ p: 4 , background:'#1f673b' , color:'white' }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                align="center"
                sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: '#fff' }}
              >
                <AccountCircle color="primary" /> Basic Information
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, mb: 4 }}>
                {/* Profile Image Left */}
                <Box sx={{ minWidth: 140, textAlign: 'center' }}>
                  <Box sx={{ position: "relative", display: "inline-block" }}>
                    <ProfileAvatar src={imagePreview || imgSrc} alt="Profile">
                      <Person sx={{ fontSize: 60 }} />
                    </ProfileAvatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        bgcolor: "#43a047",
                        color: "white",
                        '&:hover': { bgcolor: '#388e3c' },
                        boxShadow: 3,
                      }}
                    >
                      <Edit />
                      <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                    </IconButton>
                  </Box>
                  {imageFile && (
                    <Button variant="contained" onClick={handleUploadImage} sx={{ mt: 2, borderRadius: 20, bgcolor: '#43a047', color: '#fff', '&:hover': { bgcolor: '#388e3c' } }}>
                      Upload Image
                    </Button>
                  )}
                </Box>
                {/* Fields Right */}
                <Box sx={{ flex: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        label="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
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
                        label="Age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <StyledTextField
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
                  </Grid>
                </Box>
              </Box>
              {/* Rest of Step 2 fields (Position, Style, etc.) */}
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 , color:'#fff !important' }}>
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

                <Grid item xs={12}>
                  <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 ,color:'#fff !important'}}>
                        Specific Position
                      </StyledFormLabel>
                      <RadioGroup value={position} onChange={(e) => setPosition(e.target.value)}>
                        {positionType === "Goalkeeper" && (
                          <FormControlLabel
                            value="Goalkeeper (GK)"
                            control={<StyledRadio />}
                            label={<span style={{ color: '#fff' }}>Goalkeeper (GK)</span>}
                          />
                        )}
                        {positionType === "Defender" && (
                          <>
                            <FormControlLabel value="Center-Back (CB)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Center-Back (CB)</span>} />
                            <FormControlLabel value="Right-Back (RB)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Right-Back (RB)</span>} />
                            <FormControlLabel value="Left-Back (LB)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Left-Back (LB)</span>} />
                            <FormControlLabel value="Right Wing-back (RWB)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Right Wing-back (RWB)</span>} />
                            <FormControlLabel value="Left Wing-back (LWB)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Left Wing-back (LWB)</span>} />
                          </>
                        )}
                        {positionType === "Midfielder" && (
                          <>
                            <FormControlLabel value="Central Midfielder (CM)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Central Midfielder (CM)</span>} />
                            <FormControlLabel value="Defensive Midfielder (CDM)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Defensive Midfielder (CDM)</span>} />
                            <FormControlLabel value="Attacking Midfielder (CAM)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Attacking Midfielder (CAM)</span>} />
                            <FormControlLabel value="Right Midfielder (RM)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Right Midfielder (RM)</span>} />
                            <FormControlLabel value="Left Midfielder (LM)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Left Midfielder (LM)</span>} />
                          </>
                        )}
                        {positionType === "Forward" && (
                          <>
                            <FormControlLabel value="Striker (ST)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Striker (ST)</span>} />
                            <FormControlLabel value="Central Forward (CF)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Central Forward (CF)</span>} />
                            <FormControlLabel value="Right Forward (RF)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Right Forward (RF)</span>} />
                            <FormControlLabel value="Left Forward (LF)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Left Forward (LF)</span>} />
                            <FormControlLabel value="Right Winger (RW)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Right Winger (RW)</span>} />
                            <FormControlLabel value="Left Winger (LW)" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Left Winger (LW)</span>} />
                          </>
                        )}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 , color:'#fff !important' }}>
                        Playing Style
                      </StyledFormLabel>
                      <RadioGroup value={style} onChange={(e) => setStyle(e.target.value)}>
                        {["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Sweeper Keeper"].map((s) => (
                          <FormControlLabel key={s} value={s} control={<StyledRadio />} label={<span style={{ color: '#fff' }}>{s}</span>} />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <FormControl component="fieldset">
                      <StyledFormLabel sx={{ mb: 1 , color:'#fff !important' }}>
                        Preferred Foot
                      </StyledFormLabel>
                      <RadioGroup value={preferredFoot} onChange={(e) => setPreferredFoot(e.target.value)} row>
                        <FormControlLabel value="Left" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Left</span>} />
                        <FormControlLabel value="Right" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Right</span>} />
                      </RadioGroup>
                    </FormControl>
                  </Card>
                <Grid item xs={12}>
                      <Card sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                        <FormControl component="fieldset">
                          <StyledFormLabel sx={{ mb: 1 }}>
                            Gender
                          </StyledFormLabel>
                          <RadioGroup value={gender} onChange={(e) => setGender(e.target.value)} row>
                            <FormControlLabel value="male" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Male</span>} />
                            <FormControlLabel value="female" control={<StyledRadio />} label={<span style={{ color: '#fff' }}>Female</span>} />
                          </RadioGroup>
                        </FormControl>
                      </Card>
                    </Grid>
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{ borderRadius: 20, px: 3, color: '#fff', borderColor: '#43a047', '&:hover': { bgcolor: '#388e3c', borderColor: '#388e3c' } }}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{ borderRadius: 20, px: 3, bgcolor: '#43a047', color: '#fff', '&:hover': { bgcolor: '#388e3c' } }}
                >
                  Next
                </Button>
              </Stack>
            </StyledPaper>
          </Box>
        </Fade>
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

            <StyledPaper elevation={0} sx={{ p: 4 , background:'#1f673b' , color:'white' }}>
              <Typography
                variant="h5"
                fontWeight="bold"
                align="center"
                sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: '#fff', letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
              >
                <Sports color="primary" /> Skills & Attributes
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    label="Shirt Number"
                    type="number"
                    value={shirtNumber}
                    onChange={(e) => setShirtNumber(e.target.value)}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                {skills.map((skill) => (
                  <Grid item xs={12} sm={6} key={skill.name}>
                    <SkillCard
                      sx={{
                        background: 'linear-gradient(135deg, #388e3c 0%, #1f673b 100%)',
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
                  onClick={handleUpdateProfile}
                  sx={{
                    borderRadius: 20,
                    px: 5,
                    bgcolor: '#43a047',
                    color: '#fff',
                    '&:hover': { bgcolor: '#388e3c' },
                    fontWeight: 600,
                    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
                  }}
                >
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </Stack>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  startIcon={<ArrowBack />}
                  sx={{ borderRadius: 20, px: 3, color: '#fff', borderColor: '#43a047', '&:hover': { bgcolor: '#388e3c', borderColor: '#388e3c' }, boxShadow: '0 2px 8px 0 rgba(67,160,71,0.12)' }}
                >
                  Previous
                </Button>
              </Stack>
            </StyledPaper>
          </Box>
        </Fade>
      </Container>
    )
  }

  return null
}

export default PlayerProfileCard





























// 'use client';

// import { useAuth } from "@/lib/hooks";
// import Image from "next/image";
// import Group from '@/Components/images/group451.png';
// import { useState, useEffect } from "react";
// import { Edit } from "@mui/icons-material";
// import { Visibility, VisibilityOff } from "@mui/icons-material";
// import {
//   Box,
//   Paper,
//   Typography,
//   TextField,
//   Button,
//   Stack,
//   Radio,
//   RadioGroup,
//   FormControlLabel,
//   FormControl,
//   FormLabel,
//   Slider,
//   CircularProgress,
//   Alert,
//   IconButton,
//   Divider,
// } from "@mui/material";
// import { updateProfile, deleteProfile } from '@/lib/api';
// // import { User } from "@/types/user";
// import { useRouter } from "next/navigation";
// // import { da } from "date-fns/locale";


// const PlayerProfileCard = () => {
//   const { user, token, isAuthenticated } = useAuth();
//   console.log('user',user)
//   console.log('user.profilePicture', user?.profilePicture);
//   const [step, setStep] = useState(1);
//   const [dribbling, setDribbling] = useState(user?.skills?.dribbling ?? 50);
//   const [shooting, setShooting] = useState(user?.skills?.shooting ?? 50);
//   const [passing, setPassing] = useState(user?.skills?.passing ?? 50);
//   const [pace, setPace] = useState(user?.skills?.pace ?? 50);
//   const [defending, setDefending] = useState(user?.skills?.defending ?? 50);
//   const [physical, setPhysical] = useState(user?.skills?.physical ?? 50);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [error, setError] = useState<string>("");
//   const [firstName, setFirstName] = useState(user?.firstName || "");
//   const [lastName, setLastName] = useState(user?.lastName || "");
//   const [age, setAge] = useState(user?.age || "");
//   const [gender, setGender] = useState(user?.gender || "");
//   const [positionType, setPositionType] = useState(user?.positionType || '');
//   const [position, setPosition] = useState(user?.position || "Goalkeeper (GK)");
//   const [style, setStyle] = useState(user?.style || "");
//   const [preferredFoot, setPreferredFoot] = useState(user?.preferredFoot || "Left");
//   const [shirtNumber, setShirtNumber] = useState(user?.shirtNumber || "");
//   const [password, setPassword] = useState(user?.password || "");
//   const [email, setEmail] = useState(user?.email || "");
//   const [showPassword, setShowPassword] = useState(false);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [, setImagePreview] = useState<string | null>(null);
//   const [imgSrc, setImgSrc] = useState(
//     user?.profilePicture || Group
//   );

//   const router = useRouter();

//   console.log('imgSrc', imgSrc);

//   useEffect(() => {
//     setImgSrc(user?.profilePicture || Group);
//   }, [user?.profilePicture]);

//   // Initialize positionType and position based on user's current position
//   useEffect(() => {
//     console.log('🔍 Initializing position from user data:', user?.position);
//     if (user?.position) {
//       const currentPosition = user.position;
//       if (currentPosition.includes("Goalkeeper")) {
//         setPositionType("Goalkeeper");
//         setPosition(currentPosition);
//       } else if (currentPosition.includes("Back") || currentPosition.includes("Wing-back")) {
//         setPositionType("Defender");
//         setPosition(currentPosition);
//       } else if (currentPosition.includes("Midfielder")) {
//         setPositionType("Midfielder");
//         setPosition(currentPosition);
//       } else if (currentPosition.includes("Forward") || currentPosition.includes("Striker") || currentPosition.includes("Winger")) {
//         setPositionType("Forward");
//         setPosition(currentPosition);
//       } else {
//         // Default fallback
//         setPositionType("Goalkeeper");
//         setPosition("Goalkeeper (GK)");
//       }
//     } else {
//       // Default values for new users
//       setPositionType("Goalkeeper");
//       setPosition("Goalkeeper (GK)");
//     }
//   }, [user?.position]);

//   // Reset position when positionType changes
//   useEffect(() => {
//     console.log('🔄 Position type changed to:', positionType);
//     if (positionType === "Goalkeeper") {
//       setPosition("Goalkeeper (GK)");
//     } else if (positionType === "Defender") {
//       setPosition("Center-Back (CB)");
//     } else if (positionType === "Midfielder") {
//       setPosition("Central Midfielder (CM)");
//     } else if (positionType === "Forward") {
//       setPosition("Striker (ST)");
//     }
//   }, [positionType]);

//   const handleNext = () => {
//     setStep((prev) => prev + 1);
//   };

//   const handlePrevious = () => {
//     setStep((prev) => (prev > 1 ? prev - 1 : prev));
//   };

//   const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     try {
//       setIsUpdating(true);
//       setError("");
//       if (!isAuthenticated || !token) {
//         throw new Error("Not authenticated. Please login again.");
//       }
      
//       // Debug: log the current state values
//       console.log('🔍 Current state values:');
//       console.log('  positionType:', positionType);
//       console.log('  position:', position);
//       console.log('  user.positionType:', user?.positionType);
      
//       const updateData = {
//         firstName,
//         lastName,
//         email,
//         age: age ? Number(age) : undefined,
//         gender,
//         position,
//         positionType,
//         style,
//         preferredFoot,
//         shirtNumber,
//         skills: {
//           dribbling,
//           shooting,
//           passing,
//           pace,
//           defending,
//           physical,
//         },
//         ...(password && { password }),
//       };

//       // Debug: log what you are sending
//       console.log("🔍 Sending updateData:", updateData);
//       console.log("🔍 positionType in updateData:", updateData.positionType);

//       const { ok, data } = await updateProfile(token, updateData);
//       if (!ok) {
//         throw new Error(data.message || "Failed to update profile");
//       }
//       alert("Profile updated successfully!");
//       router.push("/dashboard");
//     } catch (error: unknown) {
//       if (error instanceof Error) {
//         setError(error.message);
//       } else {
//         setError("Failed to update profile. Please try again.");
//       }
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleDeleteProfile = async () => {
//     if (!token) return;
//     if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
//     const ok = await deleteProfile(token);
//     if (ok) {
//       localStorage.clear();
//       window.location.href = '/';
//     } else {
//       alert("Failed to delete account. Please try again.");
//     }
//   };

//   const getSkillLabel = (value: number) => {
//     if (value >= 80) return { text: `${value} Elite`, color: "error.main" };
//     if (value >= 70) return { text: `${value} Professional`, color: "primary.main" };
//     return { text: `${value} Amateur`, color: "success.main" };
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const fullName = e.target.value;
//     const parts = fullName.trim().split(' ');

//     setFirstName(parts[0] || '');
//     setLastName(parts.slice(1).join(' ') || ''); // support middle names too
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setImageFile(e.target.files[0]);
//       setImagePreview(URL.createObjectURL(e.target.files[0]));
//     }
//   };

//   const handleUploadImage = async () => {
//     if (!imageFile || !token) return;
//     const formData = new FormData();
//     formData.append('profilePicture', imageFile);
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${token}` },
//       body: formData,
//     });
//     const data = await res.json();
//     if (data.success) {
//       alert('Profile picture updated!');
//       window.location.reload();
//     } else {
//       alert('Failed to upload image');
//     }
//   };

//   const handleTogglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   // const handlePositionTypeChange = (newPositionType: string) => {
//   //   setPositionType(newPositionType);
//   // };

//   if (step === 1) {
//     return (
//       <Box
//         sx={{
//           maxWidth: "100%",
//           mx: "auto",
//           p: 4,
//           // backgroundImage: `url(${Frame.src})`,
//           backgroundAttachment: 'fixed',
//           backgroundSize: 'cover',
//           backgroundRepeat: 'no-repeat',
//           backgroundPosition: 'center',
//           minHeight: "100vh",
//         }}
//       >
//         <Paper
//           elevation={3}
//           sx={{
//             maxWidth: 448,
//             mx: "auto",
//             p: 4,
//             borderRadius: 2,
//             backgroundColor: "rgba(255, 255, 255, 0.9)",
//           }}
//         >
//           <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
//             <Stack spacing={1}>
//               <Stack direction="row" spacing={2} alignItems="center">
//                 <Typography variant="body2" sx={{ width: "15%", fontWeight: "medium", color: "text.primary" }}>
//                   Name
//                 </Typography>
//                 <TextField
//                   name="name"
//                   defaultValue={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`: "Waqaar Ahmad"}
//                   InputProps={{ readOnly: true }}
//                   size="small"
//                   sx={{ flex: 1 }}
//                 />
//               </Stack>
//               <Stack direction="row" spacing={2} alignItems="center">
//                 <Typography variant="body2" sx={{ width: "15%", fontWeight: "medium", color: "text.primary" }}>
//                   Age
//                 </Typography>
//                 <TextField
//                   name="age"
//                   defaultValue={user?.age || "18"}
//                   InputProps={{ readOnly: true }}
//                   size="small"
//                   sx={{ flex: 1 }}
//                 />
//               </Stack>
//               <Stack direction="row" spacing={2} alignItems="center">
//                 <Typography variant="body2" sx={{ width: "15%", fontWeight: "medium", color: "text.primary" }}>
//                   Email
//                 </Typography>
//                 <TextField
//                   name="email"
//                   defaultValue={user?.email || "your.email@address.com"}
//                   InputProps={{ readOnly: true }}
//                   size="small"
//                   sx={{ flex: 1 }}
//                 />
//               </Stack>
//             </Stack>
//             <Stack alignItems="center" spacing={1}>
//               <Typography variant="h6" fontWeight="bold">
//                 Profile Pic
//               </Typography>
//               <Image 
//                 src={imgSrc}
//                 alt="Profile" 
//                 className="w-30 h-30"
//                 width={84} 
//                 height={84} 
//                 style={{ borderRadius: "50%" }} 
//                 onError={() => setImgSrc(Group)}
//               />
//               <Button variant="contained" color="primary" onClick={handleNext}>
//                 Edit Profile
//               </Button>
//             </Stack>
//           </Stack>
//           <Divider sx={{ my: 2 }} />
//           <Stack spacing={1}>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Position Type
//               </Typography>
//               <TextField
//                 name="positionType"
//                 defaultValue={positionType}
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Your Style
//               </Typography>
//               <TextField
//                 name="style"
//                 defaultValue="Axe"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Preferred Foot
//               </Typography>
//               <TextField
//                 name="foot"
//                 defaultValue="Left"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Shirt Number
//               </Typography>
//               <TextField
//                 name="shirtNumber"
//                 defaultValue="03"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Dribbling (DRI)
//               </Typography>
//               <TextField
//                 name="dribbling"
//                 defaultValue="50 Amateur"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Shooting (SHO)
//               </Typography>
//               <TextField
//                 name="shooting"
//                 defaultValue="75 Professional"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Passing (PAS)
//               </Typography>
//               <TextField
//                 name="passing"
//                 defaultValue="82 Amateur"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Pace (PAC)
//               </Typography>
//               <TextField
//                 name="pace"
//                 defaultValue="50 Amateur"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Defending (DEF)
//               </Typography>
//               <TextField
//                 name="defending"
//                 defaultValue="50 Amateur"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//             <Stack direction="row" spacing={2} alignItems="center">
//               <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
//                 Physical (PHY)
//               </Typography>
//               <TextField
//                 name="physical"
//                 defaultValue="50 Amateur"
//                 InputProps={{ readOnly: true }}
//                 size="small"
//                 sx={{ flex: 1 }}
//               />
//             </Stack>
//           </Stack>
//         </Paper>
//       </Box>
//     );
//   }

//   if (step === 2) {
//     return (
//       <Box
//         sx={{
//           maxWidth: "100%",
//           mx: "auto",
//           p: 4,
//           // backgroundImage: "url('/assets/SplashScreen.png')",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           minHeight: "100vh",
//         }}
//       >
//         <Paper
//           elevation={3}
//           sx={{
//             maxWidth: 448,
//             mx: "auto",
//             p: 4,
//             borderRadius: 2,
//             backgroundColor: "rgba(255, 255, 255, 0.9)",
//           }}
//         >
//           <Typography variant="h6" fontWeight="bold" align="center" mb={2}>
//             Upload Pic
//           </Typography>
//           <Box sx={{ position: "relative", display: "flex", justifyContent: "center", mb: 2 }}>
//             <Image 
//               src={user?.profilePicture || Group} 
//               alt="Profile" 
//               width={64} 
//               height={64} 
//               style={{ borderRadius: "50%" }} 
//             />
//             <IconButton
//               sx={{ position: "absolute", bottom: 0, right: "calc(50% - 32px)", bgcolor: "white", p: 0.5 }}
//               component="label"
//             >
//               <Edit fontSize="small" />
//               <input type="file" accept="image/*" hidden onChange={handleImageChange} />
//             </IconButton>
//           </Box>
//           {imageFile && (
//             <Button variant="contained" color="primary" onClick={handleUploadImage} sx={{ mb: 2 }}>
//               Upload Image
//             </Button>
//           )}
//           <Stack spacing={2}>
//             <TextField
//               label="Name"
//               name="name"
//               value={`${firstName} ${lastName}`.trim()}
//               onChange={handleChange}
//               inputProps={{ maxLength: 30 }}
//               placeholder="Maximum 12 Characters"
//               size="small"
//               fullWidth
//             />
//               <FormControl>
//                 <FormLabel>Position Type</FormLabel>
//                 <RadioGroup name="positionType" value={positionType} onChange={e => setPositionType(e.target.value)}>
//                   {["Goalkeeper", "Defender", "Midfielder", "Forward"].map((type) => (
//                     <FormControlLabel key={type} value={type} control={<Radio color="success" />} label={type} />
//                   ))}
//                 </RadioGroup>
//               </FormControl>
//               <FormControl>
//                 <FormLabel>Position</FormLabel>
//                 <RadioGroup name="position" value={position} onChange={e => setPosition(e.target.value)}>
//                   {positionType === "Goalkeeper" && (
//                     <FormControlLabel value="Goalkeeper (GK)" control={<Radio color="success" />} label="Goalkeeper (GK)" />
//                   )}
//                   {positionType === "Defender" && (
//                     <>
//                       <FormControlLabel value="Center-Back (CB)" control={<Radio color="success" />} label="Center-Back (CB)" />
//                       <FormControlLabel value="Right-Back (RB)" control={<Radio color="success" />} label="Right-Back (RB)" />
//                       <FormControlLabel value="Left-Back (LB)" control={<Radio color="success" />} label="Left-Back (LB)" />
//                       <FormControlLabel value="Right Wing-back (RWB)" control={<Radio color="success" />} label="Right Wing-back (RWB)" />
//                       <FormControlLabel value="Left Wing-back (LWB)" control={<Radio color="success" />} label="Left Wing-back (LWB)" />
//                     </>
//                   )}
//                   {positionType === "Midfielder" && (
//                     <>
//                       <FormControlLabel value="Central Midfielder (CM)" control={<Radio color="success" />} label="Central Midfielder (CM)" />
//                       <FormControlLabel value="Defensive Midfielder (CDM)" control={<Radio color="success" />} label="Defensive Midfielder (CDM)" />
//                       <FormControlLabel value="Attacking Midfielder (CAM)" control={<Radio color="success" />} label="Attacking Midfielder (CAM)" />
//                       <FormControlLabel value="Right Midfielder (RM)" control={<Radio color="success" />} label="Right Midfielder (RM)" />
//                       <FormControlLabel value="Left Midfielder (LM)" control={<Radio color="success" />} label="Left Midfielder (LM)" />
//                     </>
//                   )}
//                   {positionType === "Forward" && (
//                     <>
//                       <FormControlLabel value="Striker (ST)" control={<Radio color="success" />} label="Striker (ST)" />
//                       <FormControlLabel value="Central Forward (CF)" control={<Radio color="success" />} label="Central Forward (CF)" />
//                       <FormControlLabel value="Right Forward (RF)" control={<Radio color="success" />} label="Right Forward (RF)" />
//                       <FormControlLabel value="Left Forward (LF)" control={<Radio color="success" />} label="Left Forward (LF)" />
//                       <FormControlLabel value="Right Winger (RW)" control={<Radio color="success" />} label="Right Winger (RW)" />
//                       <FormControlLabel value="Left Winger (LW)" control={<Radio color="success" />} label="Left Winger (LW)" />
//                     </>
//                   )}
//                 </RadioGroup>
//               </FormControl>
//               <FormControl>
//                 <FormLabel>Your Style of Playing</FormLabel>
//                 <RadioGroup name="style" value={style} onChange={e => setStyle(e.target.value)}>
//                   {["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Sweeper Keeper"].map((s) => (
//                     <FormControlLabel key={s} value={s} control={<Radio color="success" />} label={s} />
//                   ))}
//                 </RadioGroup>
//               </FormControl>
//               <FormControl>
//                 <FormLabel>Preferred Foot</FormLabel>
//                 <RadioGroup name="preferredFoot" value={preferredFoot} onChange={e => setPreferredFoot(e.target.value)} row>
//                   <FormControlLabel value="Left" control={<Radio color="success" />} label="Left" />
//                   <FormControlLabel value="Right" control={<Radio color="success" />} label="Right" />
//                 </RadioGroup>
//               </FormControl>
//             <Button variant="contained" color="primary" onClick={handleNext} fullWidth>
//               Next
//             </Button>
//           </Stack>
//         </Paper>
//       </Box>
//     );
//   }

//   if (step === 3) {
//     return (
//       <Box
//         sx={{
//           maxWidth: "100%",
//           mx: "auto",
//           p: 4,
//           // backgroundImage: "url('/assets/SplashScreen.png')",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           minHeight: "100vh",
//         }}
//       >
//         <Paper
//           elevation={3}
//           sx={{
//             maxWidth: 448,
//             mx: "auto",
//             p: 4,
//             borderRadius: 2,
//             backgroundColor: "rgba(255, 255, 255, 0.9)",
//           }}
//         >
//           <Stack spacing={2}>
//             <TextField
//               label="Shirt Number"
//               name="shirtNumber"
//               type="number"
//               value={shirtNumber}
//               onChange={e => setShirtNumber(e.target.value)}
//               inputProps={{ min: 0 }}
//               size="small"
//               fullWidth
//             />
//             <Box>
//               <Typography variant="body2" fontWeight="medium">
//                 Dribbling (DRI)
//               </Typography>
//               <Slider
//                 name="dribbling"
//                 value={dribbling}
//                 onChange={(e, value) => setDribbling(value as number)}
//                 min={50}
//                 max={99}
//                 step={1}
//               />
//               <Typography align="center" sx={{ color: getSkillLabel(dribbling).color }}>
//                 {getSkillLabel(dribbling).text}
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" fontWeight="medium">
//                 Shooting (SHO)
//               </Typography>
//               <Slider
//                 name="shooting"
//                 value={shooting}
//                 onChange={(e, value) => setShooting(value as number)}
//                 min={50}
//                 max={99}
//                 step={1}
//               />
//               <Typography align="center" sx={{ color: getSkillLabel(shooting).color }}>
//                 {getSkillLabel(shooting).text}
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" fontWeight="medium">
//                 Passing (PAS)
//               </Typography>
//               <Slider
//                 name="passing"
//                 value={passing}
//                 onChange={(e, value) => setPassing(value as number)}
//                 min={50}
//                 max={99}
//                 step={1}
//               />
//               <Typography align="center" sx={{ color: getSkillLabel(passing).color }}>
//                 {getSkillLabel(passing).text}
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" fontWeight="medium">
//                 Pace (PAC)
//               </Typography>
//               <Slider
//                 name="pace"
//                 value={pace}
//                 onChange={(e, value) => setPace(value as number)}
//                 min={50}
//                 max={99}
//                 step={1}
//               />
//               <Typography align="center" sx={{ color: getSkillLabel(pace).color }}>
//                 {getSkillLabel(pace).text}
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" fontWeight="medium">
//                 Defending (DEF)
//               </Typography>
//               <Slider
//                 name="defending"
//                 value={defending}
//                 onChange={(e, value) => setDefending(value as number)}
//                 min={50}
//                 max={99}
//                 step={1}
//               />
//               <Typography align="center" sx={{ color: getSkillLabel(defending).color }}>
//                 {getSkillLabel(defending).text}
//               </Typography>
//             </Box>
//             <Box>
//               <Typography variant="body2" fontWeight="medium">
//                 Physical (PHY)
//               </Typography>
//               <Slider
//                 name="physical"
//                 value={physical}
//                 onChange={(e, value) => setPhysical(value as number)}
//                 min={50}
//                 max={99}
//                 step={1}
//               />
//               <Typography align="center" sx={{ color: getSkillLabel(physical).color }}>
//                 {getSkillLabel(physical).text}
//               </Typography>
//             </Box>
//             <Stack direction="row" justifyContent="space-between">
//               <Button variant="contained" color="secondary" onClick={handlePrevious}>
//                 Previous
//               </Button>
//               <Button variant="contained" color="primary" onClick={handleNext}>
//                 Next
//               </Button>
//             </Stack>
//           </Stack>
//         </Paper>
//       </Box>
//     );
//   }

//   if (step === 4) {
//     return (
//       <Box
//         sx={{
//           maxWidth: "100%",
//           mx: "auto",
//           p: 4,
//           // backgroundImage: "url('/assets/SplashScreen.png')",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           minHeight: "100vh",
//         }}
//       >
//         <Paper
//           elevation={3}
//           sx={{
//             maxWidth: 448,
//             mx: "auto",
//             p: 4,
//             borderRadius: 2,
//             backgroundColor: "rgba(255, 255, 255, 0.9)",
//           }}
//         >
//           {error && (
//             <Alert severity="error" sx={{ mb: 2 }}>
//               {error}
//             </Alert>
//           )}
//           <Box component="form" id="profileForm" onSubmit={handleUpdateProfile}>
//             <Stack spacing={2}>
//               <TextField
//                 label="Email Address"
//                 name="email"
//                 type="email"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 size="small"
//                 fullWidth
//               />
//               <TextField
//                 label="Change Password"
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 placeholder="Leave blank to keep current password"
//                 size="small"
//                 fullWidth
//                 InputProps={{
//                   endAdornment: (
//                     <IconButton
//                       onClick={handleTogglePasswordVisibility}
//                       edge="end"
//                     >
//                       {showPassword ? <VisibilityOff /> : <Visibility />}
//                     </IconButton>
//                   ),
//                 }}
//               />
//               <TextField
//                 label="First Name"
//                 name="firstName"
//                 value={firstName}
//                 onChange={e => setFirstName(e.target.value)}
//                 size="small"
//                 fullWidth
//               />
//               <TextField
//                 label="Last Name"
//                 name="lastName"
//                 value={lastName}
//                 onChange={e => setLastName(e.target.value)}
//                 size="small"
//                 fullWidth
//               />
//               <TextField
//                 label="Age"
//                 name="age"
//                 type="number"
//                 value={age}
//                 onChange={e => setAge(e.target.value)}
//                 size="small"
//                 fullWidth
//               />
//               <FormControl>
//                 <FormLabel>Gender</FormLabel>
//                 <RadioGroup name="gender" value={gender} onChange={e => setGender(e.target.value)} row>
//                   <FormControlLabel value="male" control={<Radio color="success" />} label="Male" />
//                   <FormControlLabel value="female" control={<Radio color="success" />} label="Female" />
//                 </RadioGroup>
//               </FormControl>
//               <Stack direction="row" justifyContent="space-between">
//                 <Button
//                   type="submit"
//                   variant="contained"
//                   color="success"
//                   disabled={isUpdating}
//                   startIcon={isUpdating ? <CircularProgress size={20} /> : null}
//                 >
//                   {isUpdating ? "Updating..." : "Update Player Card"}
//                 </Button>
//                 <Button variant="contained" color="error" onClick={handleDeleteProfile}>
//                   Delete Account
//                 </Button>
//               </Stack>
//             </Stack>
//           </Box>
//         </Paper>
//       </Box>
//     );
//   }
// };

// export default PlayerProfileCard;
