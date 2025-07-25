import React from 'react';
import Image from 'next/image';
import {
    Box,
    Typography,
    Avatar,
    Divider,
} from '@mui/material';
import vector from '@/Components/images/Vector.svg';
import Foot from '@/Components/images/foot.png'
import imgicon from '@/Components/images/imgicon.png'

interface PlayerCardProps {
    name: string;
    number: string;
    level: string;
    stats: {
        DRI: string;
        SHO: string;
        PAS: string;
        PAC: string;
        DEF: string;
        PHY: string;
    };
    foot: string;
    shirtIcon: string;
    profileImage?: string;
    children?: React.ReactNode;
    width?: number | string;
    height?: number | string;
    isCaptain?: boolean;
    backgroundColor?: string; // <-- add this
}

const ResponsiveCard = ({
    name,
    number,
    level,
    foot,
    stats,
    profileImage,
    children,
    width,
    height,
    isCaptain,
    backgroundColor, // <-- add this
}: PlayerCardProps) => {
    const getShortName = (fullName: string) => {
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) return parts[0]; // Only one name
        const firstInitial = parts[0][0];
        const lastName = parts[parts.length - 1];
        return `${firstInitial} ${lastName}`;
    };

    return (
        <Box
            sx={{
                width: width || 180,
                height: height || 180,
                maxWidth: 200,
                maxHeight: 200,
                position: 'relative',
                fontWeight: 'bold',
                color: 'white',
                overflow: 'hidden',
                backgroundColor: backgroundColor || '#0a3e1e', // <-- use prop or default
            }}
        >
            {/* Keep SVG image same */}
            <Image
                src={vector}
                alt="Card Background"
                layout="fill"
                objectFit="contain"
                className="z-0"
            />

            {/* Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    px: 6,
                    py: 2
                }}
            >
                {/* Shirt number */}
                <Typography fontSize="10px" textAlign="center">
                    NO. <span style={{ fontSize: '14px' }}>{number} {isCaptain && '(C)'}</span>
                </Typography>

                {/* Info section */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    {/* Left Info */}
                    <Box textAlign="left">
                        <Typography fontSize="11px">{number}</Typography>
                        <Divider sx={{ bgcolor: 'white' }} />
                        <Typography fontSize="10px">XXX</Typography>
                        <Divider sx={{ bgcolor: 'white' }} />
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Image src={Foot} alt="Foot" width={10} height={6} />
                            <Typography fontSize="9px">{foot}</Typography>
                        </Box>
                    </Box>

                    {/* Avatar */}
                    <Box
                        sx={{
                            width: 35,
                            height: 35,
                            border: '1px solid white',
                            borderRadius: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Avatar
                            src={typeof profileImage === 'string' ? profileImage : undefined}
                            sx={{ width: 35, height: 35 }}
                            alt="Profile"
                        >
                            {(!profileImage || typeof profileImage !== 'string') && (
                                <Image src={imgicon.src} alt="Profile" width={40} height={40} />
                            )}
                        </Avatar>
                    </Box>
                </Box>

                {/* Name & Level */}
                <Box textAlign="center">
                    <Typography fontSize="10px" textTransform="uppercase">
                        {getShortName(name)}
                    </Typography>

                    <Typography fontSize="9px">Level {level}</Typography>
                </Box>

                {/* Stats */}
                <Box display="flex" justifyContent="center" alignItems="center" gap={0.3}>
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                        <Typography fontSize="8px">{stats.DRI} DRI</Typography>
                        <Typography fontSize="8px">{stats.SHO} SHO</Typography>
                        <Typography fontSize="8px">{stats.PAS} PAS</Typography>
                    </Box>
                    <Box sx={{ width: '1px', height: '40px', bgcolor: 'white' }} />
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                        <Typography fontSize="8px">{stats.PAC} PAC</Typography>
                        <Typography fontSize="8px">{stats.DEF} DEF</Typography>
                        <Typography fontSize="8px">{stats.PHY} PHY</Typography>
                    </Box>
                </Box>

                {/* Children (vote button, etc.) */}
                {children && (
                    <Box mt={0.5} display="flex" justifyContent="center">
                        {children}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ResponsiveCard;