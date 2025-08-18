import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Container, Paper, Divider } from '@mui/material';
import api from '../api/axios';
import '../App.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/send-otp', { email, type: 'reset' });
      setStep(2);
      setSuccess('OTP sent to your email. Please enter it below.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
      setSuccess('OTP verified. Please enter your current and new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        currentPassword,
        newPassword,
      });
      setSuccess('Password updated successfully! You can now log in.');
      setStep(1);
      setEmail('');
      setOtp('');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Forgot Password
        </Typography>
        {step === 1 && (
          <Box component="form" onSubmit={handleSendOtp}>
            <TextField
              margin="normal"
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
          <Box component="form" onSubmit={handleVerifyOtp}>
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
              Verify OTP
            </Button>
          </Box>
        )}
        {step === 3 && (
          <Box component="form" onSubmit={handleResetPassword}>
            <TextField
              margin="normal"
              fullWidth
              label="Current Password"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
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
              Reset Password
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;