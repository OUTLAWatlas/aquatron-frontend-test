import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Grid } from '@mui/material';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { getSocket } from '../socket';
import { useAuth } from '../auth/AuthContext';

const Dashboard = () => {
  const { role } = useAuth();
  const [deviceData, setDeviceData] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = getSocket();
    socket.on('device-data', (data) => {
      if (data.type === 'heartbeat') {
        const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        setDeviceData(`Heartbeat Device ID: ${data.deviceId} `);
        setDeviceId(data.deviceId);
      } else {
        setDeviceData(data.payload || JSON.stringify(data));
      }
    });
    socket.on('device-error', (err) => setError(err));
    socket.on('device-status', (data) => {
      console.log('Received device-status event:', data);
      if (data && data.deviceId) {
        setDeviceId(data.deviceId);
        // Also set device data to show heartbeat information
        const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        const status = data.status || 'online';
        const message = data.message || 'Device online';
        setDeviceData(`${message} - Device ID: ${data.deviceId}`);
      }
    });
    return () => {
      socket.off('device-data');
      socket.off('device-error');
      socket.off('device-status');
    };
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2} sx={{ letterSpacing: 2, color: 'primary.main', textShadow: '0 2px 12px #00bcd4aa' }}>
        AQUATRON Home Page
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={6}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '20px',
              background: 'rgba(16,22,36,0.85)',
              boxShadow: '0 8px 32px 0 rgba(0,188,212,0.18)',
              border: '3px solid',
              borderImage: 'linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%) 1',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: '0 12px 40px 0 #00bcd4cc',
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'secondary.light', fontWeight: 700, letterSpacing: 1 }}>
              Live Device ID:
            </Typography>
            <Typography variant="body2" color={deviceId ? 'primary' : 'text.secondary'} sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
              {deviceId ? deviceId : 'No device online'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={6}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '20px',
              background: 'rgba(16,22,36,0.85)',
              boxShadow: '0 8px 32px 0 rgba(124,77,255,0.18)',
              border: '3px solid',
              borderImage: 'linear-gradient(135deg, #7c4dff 0%, #00bcd4 100%) 1',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: '0 12px 40px 0 #7c4dffcc',
              },
            }}
          >
            <Typography variant="h6" sx={{ color: 'primary.light', fontWeight: 800, letterSpacing: 1 }}>
              Live Device Data
            </Typography>
            <Box>
              {deviceData ? (
                <Box>
                  <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                    {deviceData}
                  </Typography>
                  {deviceId && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Last heartbeat: {new Date().toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body1">
                  No device data yet. Waiting for heartbeat packets...
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper
            elevation={6}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '20px',
              background: 'rgba(16,22,36,0.85)',
              boxShadow: '0 8px 32px 0 rgba(0,188,212,0.10)',
              border: '3px solid',
              borderImage: 'linear-gradient(135deg, #00bcd4 0%, #7c4dff 100%) 1',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'scale(1.01)',
                boxShadow: '0 8px 32px 0 #00bcd4cc',
              },
            }}
          >
            <AnalyticsPanel />
          </Paper>
        </Grid>
      </Grid>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="body2" sx={{ mt: 2, color: 'secondary.light', fontWeight: 700 }}>
        Role: {role}
      </Typography>
    </Box>
  );
};

export default Dashboard;
