"use client";
import React from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';
import Layer from '@/Components/images/logonavbar.png';

function LogoNavbar() {
  return (
    <>
      {/* Main Navbar */}
      <Box
        sx={{
          width: '100%',
          backgroundColor: '#101010',
          display: 'flex',
          justifyContent: { xs: 'center', md: 'flex-start' },
          py: 1,
          px: { xs: 2, md: 7 }
        }}
      >
        <Box sx={{ width: { xs: 300, sm: 340, md: 700 }, mx: { xs: 'auto', md: 0 } }}>
          <Image
            src={Layer}
            alt="Champion Footballer Logo"
            width={700}
            height={130}
            style={{ width: '100%', height: 'auto' }}
            priority
          />
        </Box>
      </Box>
      
      {/* Orange Bottom Bar */}
      <Box sx={{ px: { xs: 2, md: 7 }, py: 1, width: '100%', backgroundColor: '#101010' }}>
        <Box
          sx={{
            width: '100%',
            height: 'var(--header-divider-height)',
            backgroundColor: 'var(--header-divider-color)',
           
          }}
        />
      </Box>
      
      {/* Dark Blue Bar */}
     
    </>
  );
}

export default LogoNavbar;
