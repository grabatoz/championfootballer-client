'use client';

import { useAuth } from "@/lib/hooks";
import Image from "next/image";
import Frame from '@/Components/images/Frame.png'
import Group from '@/Components/images/group451.png';
import { useState, useEffect } from "react";
import { Edit } from "@mui/icons-material";
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
  Divider,
} from "@mui/material";
import { updateProfile, deleteProfile } from '@/lib/api';
import { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { da } from "date-fns/locale";


const PlayerProfileCard = () => {
  const { user, token, isAuthenticated } = useAuth();
  console.log('user',user)
  console.log('user.profilePicture', user?.profilePicture);
  const [step, setStep] = useState(1);
  const [dribbling, setDribbling] = useState(user?.skills?.dribbling ?? 50);
  const [shooting, setShooting] = useState(user?.skills?.shooting ?? 50);
  const [passing, setPassing] = useState(user?.skills?.passing ?? 50);
  const [pace, setPace] = useState(user?.skills?.pace ?? 50);
  const [defending, setDefending] = useState(user?.skills?.defending ?? 50);
  const [physical, setPhysical] = useState(user?.skills?.physical ?? 50);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string>("");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [age, setAge] = useState(user?.age || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [positionType, setPositionType] = useState(user?.position || "");
  const [position, setPosition] = useState(user?.position || "Goalkeeper (GK)");
  const [style, setStyle] = useState(user?.style || "Axe");
  const [preferredFoot, setPreferredFoot] = useState(user?.preferredFoot || "Left");
  const [shirtNumber, setShirtNumber] = useState(user?.shirtNumber || "");
  const [password, setPassword] = useState(user?.password || "");
  const [email, setEmail] = useState(user?.email || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState(
    user?.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}` : Group
  );

  const router = useRouter();

  console.log('imgSrc', imgSrc);

  useEffect(() => {
    setImgSrc(user?.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}` : Group);
  }, [user?.profilePicture]);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      setError("");
      if (!isAuthenticated || !token) {
        throw new Error("Not authenticated. Please login again.");
      }
      const updateData = {
        firstName,
        lastName,
        email,
        age: age && age !== "" ? Number(age) : undefined,
        gender,
        position,
        style,
        preferredFoot,
        shirtNumber,
        ...(password && password !== "" && { password }),
        skills: {
          dribbling,
          shooting,
          passing,
          pace,
          defending,
          physical,
        },
      };

      // Debug: log what you are sending
      console.log("Sending updateData:", updateData);

      const { ok, data } = await updateProfile(token, updateData);
      if (!ok) {
        throw new Error(data.message || "Failed to update profile");
      }
      alert("Profile updated successfully!");
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    const ok = await deleteProfile(token);
    if (ok) {
      localStorage.clear();
      window.location.href = '/';
    } else {
      alert("Failed to delete account. Please try again.");
    }
  };

  const getSkillLabel = (value: number) => {
    if (value >= 80) return { text: `${value} Elite`, color: "error.main" };
    if (value >= 70) return { text: `${value} Professional`, color: "primary.main" };
    return { text: `${value} Amateur`, color: "success.main" };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    const parts = fullName.trim().split(' ');

    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || ''); // support middle names too
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile || !token) return;
    const formData = new FormData();
    formData.append('profilePicture', imageFile);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/picture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      alert('Profile picture updated!');
      window.location.reload();
    } else {
      alert('Failed to upload image');
    }
  };

  if (step === 1) {
    return (
      <Box
        sx={{
          maxWidth: "100%",
          mx: "auto",
          p: 4,
          backgroundImage: `url(${Frame.src})`,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 448,
            mx: "auto",
            p: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                  Name
                </Typography>
                <TextField
                  name="name"
                  defaultValue={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`: "Waqaar Ahmad"}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                  Age
                </Typography>
                <TextField
                  name="age"
                  defaultValue={user?.age || "18"}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                  Email
                </Typography>
                <TextField
                  name="email"
                  defaultValue={user?.email || "your.email@address.com"}
                  InputProps={{ readOnly: true }}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Stack>
            </Stack>
            <Stack alignItems="center" spacing={1}>
              <Typography variant="h6" fontWeight="bold">
                Profile Pic
              </Typography>
              <Image 
                src={imgSrc}
                alt="Profile" 
                className="w-20 h-20"
                width={64} 
                height={64} 
                style={{ borderRadius: "50%" }} 
                onError={() => setImgSrc(Group)}
              />
              <Button variant="contained" color="primary" onClick={handleNext}>
                Edit Profile
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Position Type
              </Typography>
              <TextField
                name="positionType"
                defaultValue="Goalkeeper (GK)"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Your Style
              </Typography>
              <TextField
                name="style"
                defaultValue="Axe"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Preferred Foot
              </Typography>
              <TextField
                name="foot"
                defaultValue="Left"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Shirt Number
              </Typography>
              <TextField
                name="shirtNumber"
                defaultValue="03"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Dribbling (DRI)
              </Typography>
              <TextField
                name="dribbling"
                defaultValue="50 Amateur"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Shooting (SHO)
              </Typography>
              <TextField
                name="shooting"
                defaultValue="75 Professional"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Passing (PAS)
              </Typography>
              <TextField
                name="passing"
                defaultValue="82 Amateur"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Pace (PAC)
              </Typography>
              <TextField
                name="pace"
                defaultValue="50 Amateur"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Defending (DEF)
              </Typography>
              <TextField
                name="defending"
                defaultValue="50 Amateur"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Physical (PHY)
              </Typography>
              <TextField
                name="physical"
                defaultValue="50 Amateur"
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ width: "33%", fontWeight: "medium", color: "text.primary" }}>
                Card Color
              </Typography>
              <Stack direction="row" alignItems="center">
                <Radio value="green" checked disabled />
                <Box sx={{ width: 16, height: 16, bgcolor: "green.500", borderRadius: "50%" }} />
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (step === 2) {
    return (
      <Box
        sx={{
          maxWidth: "100%",
          mx: "auto",
          p: 4,
          backgroundImage: "url('/assets/SplashScreen.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 448,
            mx: "auto",
            p: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Typography variant="h6" fontWeight="bold" align="center" mb={2}>
            Upload Pic
          </Typography>
          <Box sx={{ position: "relative", display: "flex", justifyContent: "center", mb: 2 }}>
            <Image 
              src={imagePreview || (user?.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}` : Group)} 
              alt="Profile" 
              width={64} 
              height={64} 
              style={{ borderRadius: "50%" }} 
            />
            <IconButton
              sx={{ position: "absolute", bottom: 0, right: "calc(50% - 32px)", bgcolor: "white", p: 0.5 }}
              component="label"
            >
              <Edit fontSize="small" />
              <input type="file" accept="image/*" hidden onChange={handleImageChange} />
            </IconButton>
          </Box>
          {imageFile && (
            <Button variant="contained" color="primary" onClick={handleUploadImage} sx={{ mb: 2 }}>
              Upload Image
            </Button>
          )}
          <Stack spacing={2}>
            <TextField
              label="Name"
              name="name"
              value={`${firstName} ${lastName}`.trim()}
              onChange={handleChange}
              inputProps={{ maxLength: 30 }}
              placeholder="Maximum 12 Characters"
              size="small"
              fullWidth
            />
            <FormControl>
              <FormLabel>Position Type</FormLabel>
              <RadioGroup name="positionType" value={positionType} onChange={e => setPositionType(e.target.value)}>
                {["Goalkeeper", "Defender", "Midfielder", "Forward"].map((type) => (
                  <FormControlLabel key={type} value={type} control={<Radio />} label={type} />
                ))}
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Position</FormLabel>
              <RadioGroup name="position" value={position} onChange={e => setPosition(e.target.value)}>
                <FormControlLabel value="Goalkeeper (GK)" control={<Radio />} label="Goalkeeper (GK)" />
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Your Style of Playing</FormLabel>
              <RadioGroup name="style" value={style} onChange={e => setStyle(e.target.value)}>
                {["Axe", "Eagle", "Iron Fist", "Shot Stopper", "Sweeper Keeper"].map((s) => (
                  <FormControlLabel key={s} value={s} control={<Radio />} label={s} />
                ))}
              </RadioGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Preferred Foot</FormLabel>
              <RadioGroup name="preferredFoot" value={preferredFoot} onChange={e => setPreferredFoot(e.target.value)} row>
                <FormControlLabel value="Left" control={<Radio />} label="Left" />
                <FormControlLabel value="Right" control={<Radio />} label="Right" />
              </RadioGroup>
            </FormControl>
            <Button variant="contained" color="primary" onClick={handleNext} fullWidth>
              Next
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (step === 3) {
    return (
      <Box
        sx={{
          maxWidth: "100%",
          mx: "auto",
          p: 4,
          backgroundImage: "url('/assets/SplashScreen.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 448,
            mx: "auto",
            p: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="Shirt Number"
              name="shirtNumber"
              type="number"
              value={shirtNumber}
              onChange={e => setShirtNumber(e.target.value)}
              inputProps={{ min: 0 }}
              size="small"
              fullWidth
            />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Dribbling (DRI)
              </Typography>
              <Slider
                name="dribbling"
                value={dribbling}
                onChange={(e, value) => setDribbling(value as number)}
                min={50}
                max={99}
                step={1}
              />
              <Typography align="center" sx={{ color: getSkillLabel(dribbling).color }}>
                {getSkillLabel(dribbling).text}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Shooting (SHO)
              </Typography>
              <Slider
                name="shooting"
                value={shooting}
                onChange={(e, value) => setShooting(value as number)}
                min={50}
                max={99}
                step={1}
              />
              <Typography align="center" sx={{ color: getSkillLabel(shooting).color }}>
                {getSkillLabel(shooting).text}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Passing (PAS)
              </Typography>
              <Slider
                name="passing"
                value={passing}
                onChange={(e, value) => setPassing(value as number)}
                min={50}
                max={99}
                step={1}
              />
              <Typography align="center" sx={{ color: getSkillLabel(passing).color }}>
                {getSkillLabel(passing).text}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Pace (PAC)
              </Typography>
              <Slider
                name="pace"
                value={pace}
                onChange={(e, value) => setPace(value as number)}
                min={50}
                max={99}
                step={1}
              />
              <Typography align="center" sx={{ color: getSkillLabel(pace).color }}>
                {getSkillLabel(pace).text}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Defending (DEF)
              </Typography>
              <Slider
                name="defending"
                value={defending}
                onChange={(e, value) => setDefending(value as number)}
                min={50}
                max={99}
                step={1}
              />
              <Typography align="center" sx={{ color: getSkillLabel(defending).color }}>
                {getSkillLabel(defending).text}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Physical (PHY)
              </Typography>
              <Slider
                name="physical"
                value={physical}
                onChange={(e, value) => setPhysical(value as number)}
                min={50}
                max={99}
                step={1}
              />
              <Typography align="center" sx={{ color: getSkillLabel(physical).color }}>
                {getSkillLabel(physical).text}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight="medium">
                Card Color
              </Typography>
              <Radio value="green" checked disabled />
              <Box sx={{ width: 16, height: 16, bgcolor: "green.500", borderRadius: "50%" }} />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Button variant="contained" color="secondary" onClick={handlePrevious}>
                Previous
              </Button>
              <Button variant="contained" color="primary" onClick={handleNext}>
                Next
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (step === 4) {
    return (
      <Box
        sx={{
          maxWidth: "100%",
          mx: "auto",
          p: 4,
          backgroundImage: "url('/assets/SplashScreen.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 448,
            mx: "auto",
            p: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" id="profileForm" onSubmit={handleUpdateProfile}>
            <Stack spacing={2}>
              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Change Password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                size="small"
                fullWidth
              />
              <TextField
                label="First Name"
                name="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Age"
                name="age"
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                size="small"
                fullWidth
              />
              <FormControl>
                <FormLabel>Gender</FormLabel>
                <RadioGroup name="gender" value={gender} onChange={e => setGender(e.target.value)} row>
                  <FormControlLabel value="male" control={<Radio color="success" />} label="Male" />
                  <FormControlLabel value="female" control={<Radio color="success" />} label="Female" />
                </RadioGroup>
              </FormControl>
              <Stack direction="row" justifyContent="space-between">
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={isUpdating}
                  startIcon={isUpdating ? <CircularProgress size={20} /> : null}
                >
                  {isUpdating ? "Updating..." : "Update Player Card"}
                </Button>
                <Button variant="contained" color="error" onClick={handleDeleteProfile}>
                  Delete Account
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Box>
    );
  }
};

export default PlayerProfileCard;