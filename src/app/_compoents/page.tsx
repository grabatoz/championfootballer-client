'use client';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import AuthTabs from '@/Components/authtabs/authtabs';
import ground from '@/Components/images/ground.png';

export default function LandingPage() {
  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        // backgroundImage: `url(${ground.src})`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, md: 4 },
        py: 6,
        overflow: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center" justifyContent="center">
          {/* Left Side - Intro */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                textAlign: { xs: 'center', md: 'left' },
                color: 'white',
                px: { xs: 2, md: 0 },
              }}
            >
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: { xs: '2rem', md: '3rem' },
                  textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                }}
              >
                Champion Footballer
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  maxWidth: 450,
                  lineHeight: 1.6,
                  color: '#f0f0f0',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                Track your progress, set availability, and dive into matches and leagues — all from here. Join now and elevate your football experience!
              </Typography>
            </Box>
          </Grid>

          {/* Right Side - Auth Form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                maxWidth: 480,
                mx: 'auto',
              }}
            >
              <AuthTabs />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
