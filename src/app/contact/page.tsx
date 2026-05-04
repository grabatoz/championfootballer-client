"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Box, TextField, Button, CircularProgress, Typography } from "@mui/material"
import { Send } from "@mui/icons-material"
import toast from "react-hot-toast"

// API module (you'll need to implement this based on your API structure)
// import api from "@/lib/api" // Adjust the import path as needed

interface ContactForm {
  name: string
  email: string
  message: string
}

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ContactForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const submitContactForm = async (value: ContactForm) => {
    setIsSubmitting(true)
    try {
      // Send the form data to your backend API endpoint that sends an email to you
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      toast.success("Message sent successfully")
      reset() // Reset form after successful submission
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to send message");
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        p: 2,
        // background: 'linear-gradient(177deg, rgba(229,106,22,0.08) 0%, rgba(207,35,38,0.08) 100%)'
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: 700 },
          background: '#1f1f1f',
          borderRadius: 4,
          boxShadow: '0 10px 34px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          p: { xs: 2, sm: 4 },
          color: '#fff',
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 2,
            color: 'white',
            fontFamily: '"Oswald", sans-serif !important',
            fontWeight: 700,
            fontSize: { xs: '32px', sm: '42px', md: '55px' },
            textTransform: 'uppercase',
            letterSpacing: '0px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Contact Us
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          sx={{ mb: 3, color: 'rgba(255,255,255,0.72)' }}
        >
          {`Have a question or feedback? Fill out the form below and we'll get back to you!`}
        </Typography>
        <Box component="form" onSubmit={handleSubmit(submitContactForm)} noValidate>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Name is required",
                maxLength: {
                  value: 41,
                  message: "Name must be 41 characters or less",
                },
              }}
              render={({ field }) => (
                <Box>
                  <Typography
                    sx={{ mb: 1, color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '22px', lineHeight: 1.1 }}
                  >
                    Your name
                  </Typography>
                  <TextField
                    {...field}
                    variant="outlined"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    inputProps={{ maxLength: 41 }}
                    sx={{
                      background: '#202225',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.75)' },
                        '&:hover fieldset': { borderColor: '#ffffff' },
                        '&.Mui-focused fieldset': { borderColor: '#ffffff' },
                        '&.Mui-error fieldset': { borderColor: '#00a77f' },
                        '&.Mui-error:hover fieldset': { borderColor: '#00a77f' },
                        '&.Mui-error.Mui-focused fieldset': { borderColor: '#00a77f' },
                        '& input': { color: '#fff', background: 'transparent' },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 1000px #202225 inset',
                          WebkitTextFillColor: '#fff',
                          color: '#fff',
                          transition: 'background-color 5000s ease-in-out 0s',
                        },
                      },
                      '& .MuiFormHelperText-root.Mui-error': { color: '#00a77f' },
                    }}
                  />
                </Box>
              )}
            />

            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
                maxLength: {
                  value: 30,
                  message: "Email must be 30 characters or less",
                },
              }}
              render={({ field }) => (
                <Box>
                  <Typography
                    sx={{ mb: 1, color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '22px', lineHeight: 1.1 }}
                  >
                    Email address
                  </Typography>
                  <TextField
                    {...field}
                    type="email"
                    variant="outlined"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    inputProps={{ maxLength: 30 }}
                    sx={{
                      background: '#202225',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.75)' },
                        '&:hover fieldset': { borderColor: '#ffffff' },
                        '&.Mui-focused fieldset': { borderColor: '#ffffff' },
                        '&.Mui-error fieldset': { borderColor: '#00a77f' },
                        '&.Mui-error:hover fieldset': { borderColor: '#00a77f' },
                        '&.Mui-error.Mui-focused fieldset': { borderColor: '#00a77f' },
                        '& input': { color: '#fff', background: 'transparent' },
                        '& input:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 1000px #202225 inset',
                          WebkitTextFillColor: '#fff',
                          color: '#fff',
                          transition: 'background-color 5000s ease-in-out 0s',
                        },
                      },
                      '& .MuiFormHelperText-root.Mui-error': { color: '#00a77f' },
                    }}
                  />
                </Box>
              )}
            />

            {/* Message Field */}
            <Controller
              name="message"
              control={control}
              rules={{
                required: "Message is required",
                maxLength: {
                  value: 500,
                  message: "Message must be 500 characters or less",
                },
              }}
              render={({ field }) => (
                <Box>
                  <Typography
                    sx={{ mb: 1, color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '22px', lineHeight: 1.1 }}
                  >
                    Your message
                  </Typography>
                  <TextField
                    {...field}
                    multiline
                    rows={4}
                    variant="outlined"
                    fullWidth
                    error={!!errors.message}
                    helperText={errors.message?.message}
                    inputProps={{ maxLength: 500 }}
                    sx={{
                      background: '#202225',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.75)' },
                        '&:hover fieldset': { borderColor: '#ffffff' },
                        '&.Mui-focused fieldset': { borderColor: '#ffffff' },
                        '&.Mui-error fieldset': { borderColor: '#00a77f' },
                        '&.Mui-error:hover fieldset': { borderColor: '#00a77f' },
                        '&.Mui-error.Mui-focused fieldset': { borderColor: '#00a77f' },
                        '& textarea': { color: '#fff', background: 'transparent' },
                        '& textarea:-webkit-autofill': {
                          WebkitBoxShadow: '0 0 0 1000px #202225 inset',
                          WebkitTextFillColor: '#fff',
                          color: '#fff',
                          transition: 'background-color 5000s ease-in-out 0s',
                        },
                      },
                      '& .MuiFormHelperText-root.Mui-error': { color: '#00a77f' },
                    }}
                  />
                </Box>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!isValid || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              sx={{
                background: '#00a77f',
                color: "white",
                fontWeight: 600,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: 16,
                boxShadow: '0 6px 16px -4px rgba(0,0,0,0.4)',
                '&:hover': {
                  background: '#009270',
                  transform: "translateY(-1px)",
                  boxShadow: "0 10px 22px -8px rgba(0,0,0,0.55)",
                },
                '&:disabled': {
                  bgcolor: "#00a77f",
                  color: "#fff",
                },
                transition: "all 0.2s ease",
              }}
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
