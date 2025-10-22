"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CloseButtonProps {
  fallbackRoute?: string;
}

export default function CloseButton({ fallbackRoute = '/dashboard' }: CloseButtonProps) {
  const router = useRouter();

  const handleCloseAndGoBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      // If there is browser history, just go back
      if (window.history.length > 1) {
        router.back();
        return;
      }
      // Try referrer when history stack isn't available (e.g., direct open)
      const ref = document.referrer;
      if (ref && ref.startsWith(window.location.origin)) {
        const path = ref.replace(window.location.origin, '') || '/';
        router.push(path);
        return;
      }
    }
    // Final fallback
    router.push(fallbackRoute);
  }, [router, fallbackRoute]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
      <Tooltip title="Close and go back">
        <IconButton 
          onClick={handleCloseAndGoBack} 
          sx={{ 
            color: '#fff',
             background: 'linear-gradient(180deg, #1f1f1f 0%, #0e0e0e 100%)',
             mb:2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }} 
          aria-label="Close and go back"
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
