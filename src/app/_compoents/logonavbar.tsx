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
          justifyContent: 'flex-start',
          py: 1,
          px: 14
        }}
      >
        <Image
          src={Layer}
          alt="Champion Footballer Logo"
          width={700}
          height={130}
          style={{ maxWidth: '100%', height: 'auto' }}
          priority
        />
      </Box>
      
      {/* Orange Bottom Bar */}
      <Box sx={{ px: 14,py:1, width: '100%', backgroundColor: '#101010'   }}>
        <Box
          sx={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e16419',
           
          }}
        />
      </Box>
      
      {/* Dark Blue Bar */}
     
    </>
  );
}

export default LogoNavbar;