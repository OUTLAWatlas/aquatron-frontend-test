import React, { useState } from 'react';
import packageJson from '../../package.json';
import { Button, TextField, Box, Typography, Alert, Paper } from '@mui/material';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.role);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }; 

  // Easter egg state
  const [egg, setEgg] = useState(false);
  const handleEgg = () => setEgg(e => !e);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e3f2fd' }}>
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, borderRadius: 3 }}>
        <Typography variant="h5" mb={2} sx={{ fontWeight: 700, color: '#1565c0' }}>AQUATRON Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, fontWeight: 700 }}>
            Login
          </Button>
        </form>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ mt: 2, fontWeight: 700 }}
          onClick={() => navigate('/signup')}
        >
          Don't have an account? Sign Up
        </Button>
        <Button
          variant="text"
          color="primary"
          fullWidth
          sx={{ mt: 1, fontWeight: 700 }}
          onClick={() => navigate('/forgot-password')}
        >
          Forgot Password?
        </Button>
        {/* Easter Egg */}
        <div
          style={{ textAlign: 'center', marginTop: 8, color: '#888', fontSize: 12, userSelect: 'none', cursor: 'pointer' }}
          onDoubleClick={handleEgg}
          title="Double click!"
        >
          {egg ? 'WirelessMinds' : `Version: ${packageJson.version}`}
        </div>
      </Paper>
    </Box>
  );
};

export default Login;
