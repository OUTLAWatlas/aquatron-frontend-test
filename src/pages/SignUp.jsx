import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Container, Paper } from '@mui/material';
import axios from 'axios';

const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [step, setStep] = useState(1); // 1: form, 2: otp
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/auth/send-otp', {
        email: form.email,
        type: 'signup',
      });
      setStep(2);
      setSuccess('OTP sent to your email. Please enter it below.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/auth/verify-otp', {
        email: form.email,
        otp,
      });
      await axios.post('/api/auth/register', {
        username: form.name,
        email: form.email,
        password: form.password,
        role: 'user',
      });
  setSuccess('Sign up successful! Redirecting to login...');
  setForm({ name: '', email: '', password: '', confirmPassword: '' });
  setOtp('');
  setStep(1);
  setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification or registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Sign Up
        </Typography>
        {step === 1 && (
          <Box component="form" onSubmit={handleSendOtp}>
            <TextField
              margin="normal"
              fullWidth
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            {error && (
              <Typography color="error" variant="body2" align="center" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="primary" variant="body2" align="center" sx={{ mt: 1 }}>
                {success}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Send OTP
            </Button>
          </Box>
        )}
        {step === 2 && (
          <Box component="form" onSubmit={handleVerifyOtpAndRegister}>
            <TextField
              margin="normal"
              fullWidth
              label="Enter OTP"
              name="otp"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
            {error && (
              <Typography color="error" variant="body2" align="center" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="primary" variant="body2" align="center" sx={{ mt: 1 }}>
                {success}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Verify OTP & Register
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SignUp;
