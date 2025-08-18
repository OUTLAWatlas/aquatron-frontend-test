import React, { useState } from 'react';
import packageJson from '../../package.json';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';
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
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  // Easter egg state
  const [egg, setEgg] = useState(false);
  const handleEgg = () => setEgg(e => !e);

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={3} boxShadow={3} borderRadius={2}>
      <Typography variant="h4" color="secondary" align="center">LOGIN PAGE DEBUG</Typography>
      <Typography variant="h5" mb={2}>Login</Typography>
      {error && <Alert severity="error">{error}</Alert>}
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
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </form>
      <Button
        variant="outlined"
        color="secondary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => navigate('/signup')}
      >
        Don't have an account? Sign Up
      </Button>
      <Button
        variant="text"
        color="primary"
        fullWidth
        sx={{ mt: 1 }}
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
      {/* Easter Egg */}
      <div style={{ textAlign: 'center', marginTop: 8, color: '#888', fontSize: 12 }}>
        🥚 Psst... You found the easter egg! 🐇
      </div>
    </Box>
  );
};

export default Login;
