import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, Grid } from '@mui/material';
import { getSocket } from '../socket';
import { useAuth } from '../auth/AuthContext';

const Dashboard = () => {
  const { role } = useAuth();
  const [deviceData, setDeviceData] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [connectionType, setConnectionType] = useState('');

  useEffect(() => {
    const socket = getSocket();
    socket.on('device-data', (data) => {
      if (data.type === 'heartbeat') {
        setDeviceData(`Device ID: ${data.deviceId}`);
      } else {
        setDeviceData(data.payload || JSON.stringify(data));
      }
    });
    socket.on('device-error', (err) => setError(err));
    socket.on('device-status', (data) => {
      if (data.online) {
        const statusText = data.status === 'device_ready' ? 'Ready' : 'Online';
        setStatus(statusText);
        
        // Determine connection type
        let connType = '';
        if (data.via === 'ws' || data.source === 'ws') {
          connType = 'WiFi';
        } else if (data.source === 'serial') {
          connType = 'UART';
        } else if (data.source === 'tcp') {
          connType = 'TCP';
        }
        setConnectionType(connType);
        
        if (data && data.deviceId) {
          const message = data.message || 'Device online';
          setDeviceData(`${message} - Device ID: ${data.deviceId}`);
        }
      } else {
        setStatus('Offline');
        setConnectionType('');
      }
    });
    socket.on('device-ready', (data) => {
      setStatus('Ready');
      if (data && data.payload) {
        setDeviceData(`Device Ready - ID: ${data.payload}`);
      }
    });
    return () => {
      socket.off('device-data');
      socket.off('device-error');
      socket.off('device-status');
      socket.off('device-ready');
    };
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={2} sx={{ fontWeight: 700, color: '#1565c0' }}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>Device Status</Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 500 }}>{status || 'Offline'}</Typography>
            {connectionType && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Connected: {connectionType}
              </Typography>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 600 }}>Live Device Data</Typography>
            {deviceData ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {deviceData}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last update: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                No device data yet. Waiting for heartbeat packets...
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      <Box mt={4} sx={{ color: '#90caf9', fontSize: 14 }}>
        <b>Role:</b> {role}
      </Box>
    </Box>
  );
};

export default Dashboard;
