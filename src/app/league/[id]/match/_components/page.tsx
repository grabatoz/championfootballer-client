'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    CircularProgress,
    Autocomplete,
    Checkbox,
    Divider,
    Avatar,
    IconButton,
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/lib/hooks';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { cacheManager } from "@/lib/cacheManager"

// Assuming User and League interfaces are available or defined here
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    shirtNumber?: string;
    level?: string;
    skills?: {
        dribbling?: number;
        shooting?: number;
        passing?: number;
        pace?: number;
        defending?: number;
        physical?: number;
    };
    preferredFoot?: 'right' | 'left';
}

interface League {
    id: string;
    name: string;
    members: User[];
    active: boolean;
}

// Add PlayerCardProps interface for the preview
// interface PlayerCardProps {
//     name: string;
//     number: string;
//     level: string;
//     stats: { DRI: string; SHO: string; PAS: string; PAC: string; DEF: string; PHY: string; };
//     foot: string;
//     shirtIcon: string;
//     profileImage?: string;
//     isCaptain?: boolean;
// }

// const icon = <span style={{ width: 16, height: 16, border: "1px solid white", borderRadius: 2 }} />
// const checkedIcon = <span style={{ width: 16, height: 16, backgroundColor: "white", borderRadius: 2 }} />

export default function ScheduleMatchPage() {
    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');
    const [matchDate, setMatchDate] = useState<Dayjs | null>(dayjs());
    const [startTime, setStartTime] = useState<Dayjs | null>(dayjs());
    const [duration, setDuration] = useState<number | ''>(90); // default 90 minutes
    const [location, setLocation] = useState('');
    const [homeTeamUsers, setHomeTeamUsers] = useState<User[]>([]);
    const [awayTeamUsers, setAwayTeamUsers] = useState<User[]>([]);
    const [homeCaptain, setHomeCaptain] = useState<User | null>(null); // captain for home team
    const [awayCaptain, setAwayCaptain] = useState<User | null>(null); // captain for away team
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Team image upload states
    const [homeTeamImage, setHomeTeamImage] = useState<File | null>(null);
    const [awayTeamImage, setAwayTeamImage] = useState<File | null>(null);
    const [homeTeamImagePreview, setHomeTeamImagePreview] = useState<string | null>(null);
    const [awayTeamImagePreview, setAwayTeamImagePreview] = useState<string | null>(null);

    const { token } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leagueId = params?.id ? String(params.id) : '';

    const fetchLeagueMembers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLeague(data.league);
            } else {
                setError(data.message || 'Failed to fetch league members');
            }
        } catch {
            setError('An error occurred while fetching league data.');
        } finally {
            setLoading(false);
        }
    }, [leagueId, token]);

    useEffect(() => {
        if (leagueId && token) {
            fetchLeagueMembers();
        }
    }, [leagueId, token, fetchLeagueMembers]);

    // Team image upload functions
    const handleHomeTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                if (file.size <= 5 * 1024 * 1024) { // 5MB limit
                    setHomeTeamImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setHomeTeamImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    toast.error('File size should be less than 5MB');
                }
            } else {
                toast.error('Please select an image file');
            }
        }
    };

    const handleAwayTeamImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                if (file.size <= 5 * 1024 * 1024) { // 5MB limit
                    setAwayTeamImage(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setAwayTeamImagePreview(e.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                } else {
                    toast.error('File size should be less than 5MB');
                }
            } else {
                toast.error('Please select an image file');
            }
        }
    };

    const handleRemoveHomeTeamImage = () => {
        setHomeTeamImage(null);
        setHomeTeamImagePreview(null);
    };

    const handleRemoveAwayTeamImage = () => {
        setAwayTeamImage(null);
        setAwayTeamImagePreview(null);
    };

    // Mapper function for the preview cards
    // const mapUserToCardProps = (user: User, isCaptain: boolean): PlayerCardProps => ({
    //     name: `${user.firstName || ''} ${user.lastName || ''}`,
    //     number: user.shirtNumber || '10',
    //     level: user.level || '1',
    //     stats: {
    //         DRI: user.skills?.dribbling?.toString() || '50',
    //         SHO: user.skills?.shooting?.toString() || '50',
    //         PAS: user.skills?.passing?.toString() || '50',
    //         PAC: user.skills?.pace?.toString() || '50',
    //         DEF: user.skills?.defending?.toString() || '50',
    //         PHY: user.skills?.physical?.toString() || '50'
    //     },
    //     foot: user.preferredFoot === 'right' ? 'R' : 'L',
    //     profileImage: user.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}` : undefined,
    //     isCaptain,
    //     shirtIcon: ''
    // });

    const handleScheduleMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!matchDate || !startTime) {
            setError('Please select a valid date and time for the match.');
            setIsSubmitting(false);
            return;
        }
        if (!homeCaptain || !awayCaptain) { // require captains
            setError('Please select a captain for both teams.');
            setIsSubmitting(false);
            return;
        }

        // Combine date and time
        const start = matchDate
            .hour(startTime.hour())
            .minute(startTime.minute())
            .second(0)
            .millisecond(0);

        const matchDuration = duration || 90; // fallback to 90 if undefined
        const end = start.add(matchDuration, 'minute');

        const matchData = {
            homeTeamName,
            awayTeamName,
            date: start.toISOString(),
            start: start.toISOString(),
            end: end.toISOString(),
            location,
            homeTeamUsers: homeTeamUsers.map(u => u.id),
            awayTeamUsers: awayTeamUsers.map(u => u.id),
            homeCaptain: homeCaptain?.id, // send home captain
            awayCaptain: awayCaptain?.id, // send away captain
        };

        console.log('match data', matchData)

        try {
            // Create FormData for file uploads
            const formData = new FormData();
            formData.append('homeTeamName', homeTeamName);
            formData.append('awayTeamName', awayTeamName);
            formData.append('date', start.toISOString());
            formData.append('start', start.toISOString());
            formData.append('end', end.toISOString());
            formData.append('location', location);
            formData.append('homeTeamUsers', JSON.stringify(homeTeamUsers.map(u => u.id)));
            formData.append('awayTeamUsers', JSON.stringify(awayTeamUsers.map(u => u.id)));
            formData.append('homeCaptain', homeCaptain?.id || '');
            formData.append('awayCaptain', awayCaptain?.id || '');

            // Add team images if selected
            if (homeTeamImage) {
                formData.append('homeTeamImage', homeTeamImage);
            }
            if (awayTeamImage) {
                formData.append('awayTeamImage', awayTeamImage);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${leagueId}/matches`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                // Update cache with new match data
                if (result.match) {
                    cacheManager.updateMatchesCache(result.match);
                }
                toast.success('Match scheduled successfully!');
                router.push(`/league/${leagueId}`);
            } else {
                throw new Error(result.message || 'Failed to schedule match.');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>;
    }

    if (error || !league) {
        return <Box sx={{ p: 4, minHeight: '100vh', color: 'white' }}>
            <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{
                mb: 2, color: 'white', backgroundColor: '#388e3c',
                '&:hover': { backgroundColor: '#388e3c' },
                borderRadius: 2
            }}>
                Back to League
            </Button>
            <Typography color="error">{error || 'Could not load league data.'}</Typography>
        </Box>;
    }

    // const availablePlayers = league.members.filter(
    //     member => ![...homeTeamUsers, ...awayTeamUsers].find(p => p.id === member.id)
    // );
    const inputStyles = {
        "& .MuiOutlinedInput-root": {
            color: "white",
            backgroundColor: "transparent",
            "& fieldset": {
                borderColor: "white",
            },
            "&:hover fieldset": {
                borderColor: "white",
                borderWidth: "2px",
            },
            "&.Mui-focused": {
                backgroundColor: "black",
                "& fieldset": {
                    borderColor: "#2196f3", // Blue color when focused
                    borderWidth: "2px",
                },
                "& input": {
                    backgroundColor: "black",
                    color: "white",
                },
                "& .MuiInputBase-input": {
                    backgroundColor: "black",
                    color: "white",
                },
            },
            "& input": {
                color: "white",
                backgroundColor: "transparent",
                "&:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px #1f673b inset",
                    WebkitTextFillColor: "white",
                },
                "&:focus": {
                    backgroundColor: "black",
                    color: "white",
                },
            },
            "& .MuiInputBase-input": {
                color: "white",
                backgroundColor: "transparent",
                "&:focus": {
                    backgroundColor: "black",
                    color: "white",
                },
            },
        },
        "& .MuiInputLabel-root": {
            color: "white",
            "&.Mui-focused": {
                color: "#2196f3", // Blue label when focused
            },
        },
        "& .MuiSvgIcon-root": {
            color: "white",
        },
    }

    const autocompleteStyles = {
        "& .MuiOutlinedInput-root": {
            color: "white",
            backgroundColor: "transparent",
            "& fieldset": {
                borderColor: "white",
            },
            "&:hover fieldset": {
                borderColor: "white",
                borderWidth: "2px",
            },
            "&.Mui-focused": {
                backgroundColor: "black",
                "& fieldset": {
                    borderColor: "#2196f3", // Blue border when focused
                    borderWidth: "2px",
                },
                "& .MuiInputBase-input": {
                    backgroundColor: "black",
                    color: "white",
                },
            },
            "& .MuiInputBase-input": {
                color: "white",
                backgroundColor: "transparent",
                "&:focus": {
                    backgroundColor: "black",
                    color: "white",
                },
            },
            "& .MuiChip-root": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "& .MuiChip-deleteIcon": {
                    color: "white",
                },
            },
        },
        "& .MuiInputLabel-root": {
            color: "white",
            "&.Mui-focused": {
                color: "#2196f3", // Blue label when focused
            },
        },
        "& .MuiSvgIcon-root": {
            color: "white",
        },
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 4, minHeight: '100vh', color: 'white' }}>
                <Button startIcon={<ArrowLeft />} onClick={() => router.push(`/league/${leagueId}`)} sx={{ mb: 2, color: 'white', backgroundColor: '#1f673b', '&:hover': { backgroundColor: '#388e3c' }, }}>
                    Back to League
                </Button>

                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Form Section */}
                    <Box sx={{ width: { xs: "100%", md: "58.33%" } }}>
                        <Paper
                            component="form"
                            onSubmit={handleScheduleMatch}
                            sx={{
                                p: 3,
                                // backgroundColor: "#1f673b",
                                background: "linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)",
                                color: "white",
                                borderRadius: 6
                            }}
                        >
                            <Typography variant="h4" component="h1" gutterBottom>
                                {league.name} Create a New Match
                            </Typography>

                            {/* Home Team Fields */}
                            <TextField
                                label="Home Team Name"
                                value={homeTeamName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHomeTeamName(e.target.value)}
                                required
                                fullWidth
                                sx={{ mt: 2, mb: 1, ...inputStyles }}
                            />

                            {/* Home Team Image Upload */}
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                                    Home Team Image (Optional)
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="home-team-image-upload"
                                        type="file"
                                        onChange={handleHomeTeamImageUpload}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Upload Home Team Image"
                                        value={homeTeamImage ? homeTeamImage.name : ''}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <label htmlFor="home-team-image-upload">
                                                        <Button
                                                            component="span"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{
                                                                color: '#43a047',
                                                                borderColor: '#43a047',
                                                                '&:hover': { borderColor: '#388e3c', backgroundColor: 'rgba(67, 160, 71, 0.1)' }
                                                            }}
                                                        >
                                                            Browse
                                                        </Button>
                                                    </label>
                                                    {homeTeamImage && (
                                                        <IconButton
                                                            onClick={handleRemoveHomeTeamImage}
                                                            size="small"
                                                            sx={{ color: '#f44336' }}
                                                        >
                                                            <X />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            )
                                        }}
                                        sx={{ ...inputStyles }}
                                    />
                                </Box>
                                {homeTeamImagePreview && (
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar
                                            src={homeTeamImagePreview}
                                            alt="Home Team Preview"
                                            sx={{ width: 40, height: 40, border: '2px solid #43a047' }}
                                        />
                                        <Typography variant="caption" sx={{ color: '#B2DFDB' }}>
                                            Image preview
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Autocomplete
                                multiple
                                options={league.members.filter((m) => !awayTeamUsers.find((p) => p.id === m.id))}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={homeTeamUsers}
                                onChange={(event, newValue) => {
                                    setHomeTeamUsers(newValue)
                                    if (homeCaptain && !newValue.some((u) => u.id === homeCaptain.id)) setHomeCaptain(null)
                                }}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} style={{ color: "black", backgroundColor: selected ? "#e3f2fd" : "white" }}>
                                        <Checkbox
                                            icon={<span style={{ width: 16, height: 16, border: "1px solid #666", borderRadius: 2 }} />}
                                            checkedIcon={<span style={{ width: 16, height: 16, backgroundColor: "#1976d2", borderRadius: 2 }} />}
                                            sx={{ marginRight: 1 }}
                                            checked={selected}
                                        />
                                        {`${option.firstName} ${option.lastName}`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Home Team Players"
                                        placeholder="Players"
                                        sx={{ mt: 1, mb: 1, ...autocompleteStyles }}
                                    />
                                )}
                                sx={{
                                    "& .MuiAutocomplete-popupIndicator": {
                                        color: "white",
                                    },
                                    "& .MuiAutocomplete-clearIndicator": {
                                        color: "white",
                                    },
                                }}
                            />

                            {homeTeamUsers.length > 0 && (
                                <Autocomplete
                                    options={homeTeamUsers}
                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                    value={homeCaptain}
                                    onChange={(event, newValue) => setHomeCaptain(newValue)}
                                    renderInput={(params) => (
                                        <TextField {...params} sx={{ mt: 2, mb: 1, ...inputStyles }} label="Select Home Team Captain" required />
                                    )}
                                    sx={{
                                        "& .MuiAutocomplete-popupIndicator": {
                                            color: "white",
                                        },
                                        "& .MuiAutocomplete-clearIndicator": {
                                            color: "white",
                                        },
                                    }}
                                />
                            )}

                            {/* Away Team Fields */}
                            <TextField
                                label="Away Team Name"
                                value={awayTeamName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwayTeamName(e.target.value)}
                                required
                                fullWidth
                                sx={{ mt: 2, mb: 1, ...inputStyles }}
                            />

                            {/* Away Team Image Upload */}
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                                    Away Team Image (Optional)
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="away-team-image-upload"
                                        type="file"
                                        onChange={handleAwayTeamImageUpload}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Upload Away Team Image"
                                        value={awayTeamImage ? awayTeamImage.name : ''}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <label htmlFor="away-team-image-upload">
                                                        <Button
                                                            component="span"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{
                                                                color: '#ef5350',
                                                                borderColor: '#ef5350',
                                                                '&:hover': { borderColor: '#d32f2f', backgroundColor: 'rgba(239, 83, 80, 0.1)' }
                                                            }}
                                                        >
                                                            Browse
                                                        </Button>
                                                    </label>
                                                    {awayTeamImage && (
                                                        <IconButton
                                                            onClick={handleRemoveAwayTeamImage}
                                                            size="small"
                                                            sx={{ color: '#f44336' }}
                                                        >
                                                            <X />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            )
                                        }}
                                        sx={{ ...inputStyles }}
                                    />
                                </Box>
                                {awayTeamImagePreview && (
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar
                                            src={awayTeamImagePreview}
                                            alt="Away Team Preview"
                                            sx={{ width: 40, height: 40, border: '2px solid #ef5350' }}
                                        />
                                        <Typography variant="caption" sx={{ color: '#EF9A9A' }}>
                                            Image preview
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Autocomplete
                                multiple
                                options={league.members.filter((m) => !homeTeamUsers.find((p) => p.id === m.id))}
                                disableCloseOnSelect
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                value={awayTeamUsers}
                                onChange={(event, newValue) => {
                                    setAwayTeamUsers(newValue)
                                    if (awayCaptain && !newValue.some((u) => u.id === awayCaptain.id)) setAwayCaptain(null)
                                }}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props} style={{ color: "black", backgroundColor: selected ? "#e3f2fd" : "white" }}>
                                        <Checkbox
                                            icon={<span style={{ width: 16, height: 16, border: "1px solid #666", borderRadius: 2 }} />}
                                            checkedIcon={<span style={{ width: 16, height: 16, backgroundColor: "#1976d2", borderRadius: 2 }} />}
                                            sx={{ marginRight: 1 }}
                                            checked={selected}
                                        />
                                        {`${option.firstName} ${option.lastName}`}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Away Team Players"
                                        placeholder="Players"
                                        sx={{ mt: 1, mb: 1, ...autocompleteStyles }}
                                    />
                                )}
                                sx={{
                                    "& .MuiAutocomplete-popupIndicator": {
                                        color: "white",
                                    },
                                    "& .MuiAutocomplete-clearIndicator": {
                                        color: "white",
                                    },
                                }}
                            />

                            {awayTeamUsers.length > 0 && (
                                <Autocomplete
                                    options={awayTeamUsers}
                                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                                    value={awayCaptain}
                                    onChange={(event, newValue) => setAwayCaptain(newValue)}
                                    renderInput={(params) => (
                                        <TextField {...params} sx={{ mt: 2, mb: 1, ...inputStyles }} label="Select Away Team Captain" required />
                                    )}
                                    sx={{
                                        "& .MuiAutocomplete-popupIndicator": {
                                            color: "white",
                                        },
                                        "& .MuiAutocomplete-clearIndicator": {
                                            color: "white",
                                        },
                                    }}
                                />
                            )}

                            {/* Date and Time Pickers */}
                            <DatePicker
                                label="Match Date"
                                value={matchDate}
                                onChange={(newValue) => setMatchDate(dayjs(newValue))}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        margin: "normal",
                                        required: true,
                                        sx: inputStyles,
                                    },
                                }}
                            />

                            <TimePicker
                                label="Start Time"
                                value={startTime}
                                onChange={(newValue) => setStartTime(dayjs(newValue))}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        margin: "normal",
                                        required: true,
                                        sx: inputStyles,
                                    },
                                }}
                            />

                            <TextField
                                label="Match Duration (minutes)"
                                type="number"
                                value={duration}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setDuration(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                required
                                fullWidth
                                sx={{ mt: 2, mb: 1, ...inputStyles }}
                            />

                            <TextField
                                label="Location"
                                value={location}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                                required
                                fullWidth
                                sx={{ mt: 2, mb: 1, ...inputStyles }}
                            />

                            {error && (
                                <Typography color="error" sx={{ my: 2 }}>
                                    {error}
                                </Typography>
                            )}

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{
                                    backgroundColor: "#43a047",
                                    "&:hover": {
                                        backgroundColor: "#388e3c",
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                    },
                                    mt: 2,
                                    transition: "all 0.2s ease-in-out",
                                }}
                                disabled={isSubmitting || league?.active === false}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : "Schedule Match"}
                            </Button>
                        </Paper>
                    </Box>
                    {/* Live Preview Section */}
                    <Box sx={{ width: { xs: '100%', md: '41.67%' } }}>
                        <Paper sx={{
                            p: 2,
                            // backgroundColor: '#1f673b', 
                            background: 'linear-gradient(0deg,rgba(2, 168, 128, 1) 43%, rgba(2, 208, 158, 1) 100%)',
                            color: 'white',
                            position: 'sticky',
                            top: '20px',
                            height: { xs: 'auto', md: 'fit-content' },
                            minHeight: { xs: 'auto', md: '100%' },
                            display: { xs: 'block', md: 'flex' },
                            flexDirection: { xs: 'column', md: 'column' },
                            borderRadius: 6
                        }}>
                            <Typography variant="h5" gutterBottom>Live Preview</Typography>
                            <Divider sx={{ mb: 2, borderColor: 'white' }} />
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'stretch',
                                justifyContent: 'center',
                                gap: 4,
                                minHeight: { xs: 250, md: 'calc(100vh - 300px)' },
                                width: '100%',
                                flex: 1
                            }}>
                                {/* Home Team Preview */}
                                <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                        <Avatar
                                            src={homeTeamImagePreview || '/assets/default-team.png'}
                                            alt="Home Team"
                                            sx={{ width: 40, height: 40, mr: 1, border: '2px solid #66bb6a' }}
                                        />
                                        <Typography variant="h6" sx={{ color: '#66bb6a', textAlign: 'center' }}>
                                            {homeTeamName || 'Home Team'}
                                        </Typography>
                                    </Box>
                                    {homeTeamUsers.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, mt: 1, width: '100%' }}>
                                            {/* Captain at top */}
                                            {homeCaptain && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                                    <Link href={`/player/${homeCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                                        <img
                                                            src={homeCaptain.profilePicture || '/assets/group.svg'}
                                                            alt={homeCaptain.firstName}
                                                            style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid gold', objectFit: 'cover' }}
                                                            width={56} height={56}
                                                        />
                                                        <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                            <Typography fontWeight="bold" fontSize={14} sx={{ mt: 0.5 }} noWrap>{homeCaptain.firstName} {homeCaptain.lastName}</Typography>
                                                            <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                        </Box>
                                                    </Link>
                                                </Box>
                                            )}
                                            {/* Other players */}
                                            {homeTeamUsers.filter(u => u.id !== homeCaptain?.id).map(user => (
                                                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.2, width: '100%' }}>
                                                    <Link href={`/player/${user?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                                        <Box sx={{ minWidth: 48, maxWidth: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <img
                                                                src={user.profilePicture || '/assets/group.svg'}
                                                                alt={user.firstName}
                                                                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: user.id === homeCaptain?.id ? '2px solid gold' : 'none' }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                            <Typography fontWeight={user.id === homeCaptain?.id ? 700 : 500} fontSize={user.id === homeCaptain?.id ? 15 : 14} noWrap sx={{ color: 'white' }}>
                                                                {user.firstName} {user.lastName}
                                                            </Typography>
                                                            {user.id === homeCaptain?.id && (
                                                                <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>
                                                                    Captain
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Link>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Select players...</Typography>}
                                </Box>
                                {/* Center Line */}
                                <Box sx={{ width: 2, bgcolor: 'white', minHeight: 180, borderRadius: 1, mx: 2, display: { xs: 'none', md: 'block' } }} />
                                {/* Away Team Preview */}
                                <Box sx={{ flex: 1, minWidth: 120, height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                        <Avatar
                                            src={awayTeamImagePreview || '/assets/default-team.png'}
                                            alt="Away Team"
                                            sx={{ width: 40, height: 40, mr: 1, border: '2px solid #ef5350' }}
                                        />
                                        <Typography variant="h6" sx={{ color: '#ef5350', textAlign: 'center' }}>
                                            {awayTeamName || 'Away Team'}
                                        </Typography>
                                    </Box>
                                    {awayTeamUsers.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1, mt: 1, width: '100%' }}>
                                            {/* Captain at top */}
                                            {awayCaptain && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                                                    <Link href={`/player/${awayCaptain?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                                        <img
                                                            src={awayCaptain.profilePicture || '/assets/group.svg'}
                                                            alt={awayCaptain.firstName}
                                                            style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid gold', objectFit: 'cover' }}
                                                            width={56} height={56}
                                                        />
                                                        <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                            <Typography fontWeight="bold" fontSize={14} sx={{ mt: 0.5 }} noWrap>{awayCaptain.firstName} {awayCaptain.lastName}</Typography>
                                                            <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>Captain</Typography>
                                                        </Box>
                                                    </Link>
                                                </Box>
                                            )}
                                            {/* Other players */}
                                            {awayTeamUsers.filter(u => u.id !== awayCaptain?.id).map(user => (
                                                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.2, width: '100%' }}>
                                                    <Link href={`/player/${user?.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                                        <Box sx={{ minWidth: 48, maxWidth: 48, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <img
                                                                src={user.profilePicture || '/assets/group.svg'}
                                                                alt={user.firstName}
                                                                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: user.id === awayCaptain?.id ? '2px solid gold' : 'none' }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ ml: 2, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                            <Typography fontWeight={user.id === awayCaptain?.id ? 700 : 500} fontSize={user.id === awayCaptain?.id ? 15 : 14} noWrap sx={{ color: 'white' }}>
                                                                {user.firstName} {user.lastName}
                                                            </Typography>
                                                            {user.id === awayCaptain?.id && (
                                                                <Typography fontSize={12} sx={{ color: 'gold', fontWeight: 'bold' }}>
                                                                    Captain
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Link>
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Select players...</Typography>}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
            <Toaster position="top-center" reverseOrder={false} />
        </LocalizationProvider>
    );
} 