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
    } catch (error: any) {
      toast.error(error.message || "Failed to send message")
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
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: 420 },
          background: '#1f673b',
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)',
          border: '2px solid #43a047',
          p: { xs: 2, sm: 4 },
          color: 'white',
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          sx={{ mb: 2, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        >
          Contact Us
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          sx={{ mb: 3, color: 'rgba(255,255,255,0.85)' }}
        >
          Have a question or feedback? Fill out the form below and we'll get back to you!
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
                <TextField
                  {...field}
                  label="Your name"
                  variant="outlined"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  inputProps={{ maxLength: 41 }}
                  sx={{
                    background: 'white',
                    borderRadius: 2,
                    bgcolor:'#0a3e1e',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#1f673b' },
                      '&:hover fieldset': { borderColor: '#1f673b' },
                      '&.Mui-focused fieldset': { borderColor: '#1f673b' },
                      '& input': { color: '#fff' },
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                        WebkitTextFillColor: '#fff',
                        color: '#fff',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
                  }}
                  InputLabelProps={{ sx: { color: '#fff' } }}
                />
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
                <TextField
                  {...field}
                  label="Email address"
                  type="email"
                  variant="outlined"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  inputProps={{ maxLength: 30 }}
                  sx={{
                    background: 'white',
                    borderRadius: 2,
                    bgcolor:'#0a3e1e',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#1f673b' },
                      '&:hover fieldset': { borderColor: '#1f673b' },
                      '&.Mui-focused fieldset': { borderColor: '#1f673b' },
                      '& input': { color: '#fff' },
                      '& input:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                        WebkitTextFillColor: '#fff',
                        color: '#fff',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
                  }}
                  InputLabelProps={{ sx: { color: '#fff' } }}
                />
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
                <TextField
                  {...field}
                  label="Your message"
                  multiline
                  rows={4}
                  variant="outlined"
                  fullWidth
                  error={!!errors.message}
                  helperText={errors.message?.message}
                  inputProps={{ maxLength: 500 }}
                  sx={{
                    background: 'white',
                    borderRadius: 2,
                    bgcolor:'#0a3e1e',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': { borderColor: '#1f673b' },
                      '&:hover fieldset': { borderColor: '#1f673b' },
                      '&.Mui-focused fieldset': { borderColor: '#1f673b' },
                      '& textarea': { color: '#fff' },
                      '& textarea:-webkit-autofill': {
                        WebkitBoxShadow: '0 0 0 1000px #0a3e1e inset',
                        WebkitTextFillColor: '#fff',
                        color: '#fff',
                        transition: 'background-color 5000s ease-in-out 0s',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#fff' },
                  }}
                  InputLabelProps={{ sx: { color: '#fff' } }}
                />
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
                bgcolor: "#43a047",
                color: "white",
                fontWeight: 600,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(67,160,71,0.18)',
                '&:hover': {
                  bgcolor: "#2e7d32",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(67, 160, 71, 0.3)",
                },
                '&:disabled': {
                  bgcolor: "#ccc",
                  color: "#666",
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
