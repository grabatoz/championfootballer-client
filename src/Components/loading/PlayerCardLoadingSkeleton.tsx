import React from 'react';
import { Box, CircularProgress } from '@mui/material';

interface PlayerCardLoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
}

export default function PlayerCardLoadingSkeleton({ width = 260, height = 410 }: PlayerCardLoadingSkeletonProps) {
  return (
    <Box
      className="route-loading-bone"
      sx={{
        width: width,
        height: height,
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.09)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxSizing: 'border-box',
      }}
    >
      <CircularProgress size={32} sx={{ color: '#00A77F' }} />
    </Box>
  );
}
