// src/components/Sidebar.jsx

import React, { useEffect, useState } from 'react';
import { Box, List, ListItemText, Divider, Typography, ListItemButton, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { getSocket } from '../socket';
import { useAuth } from '../auth/AuthContext';


const Sidebar = () => {
  const { role } = useAuth();
  const [deviceId, setDeviceId] = useState('');
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.on('device-status', (data) => {
      if (data && data.deviceId) {
        setDeviceId(data.deviceId);
      }
    });
    return () => {
      socket.off('device-status');
    };
  }, []);

  const drawerContent = (
    <Box
      sx={{ width: 240, bgcolor: 'background.paper', height: '100%', p: 2, position: 'relative' }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Aquatronics
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Live Device ID:</Typography>
        <Typography 
          variant="body2" 
          color={deviceId ? 'primary' : 'text.secondary'}
          sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxWidth: '100%' }}
        >
          {deviceId
            ? deviceId.replace(/(.{12})/g, '$1\n')
            : 'No device online'}
        </Typography>
      </Box>
      <List>
        <ListItemButton component="a" href="/">
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component="a" href="/history">
          <ListItemText primary="History" />
        </ListItemButton>
        {(role === 'admin' || role === 'superadmin') && (
          <ListItemButton component="a" href="/admin">
            <ListItemText primary="Admin Panel" />
          </ListItemButton>
        )}
      </List>
      <Box sx={{ position: 'absolute', bottom: 16, left: 0, width: '100%', textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{ cursor: 'pointer', userSelect: 'none', display: 'block' }}
          onDoubleClick={() => setShowEasterEgg((v) => !v)}
        >
          {showEasterEgg ? 'WirelessMind' : 'Version 1.0'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* AppBar for mobile hamburger menu */}
      <AppBar position="fixed" sx={{ display: { xs: 'block', md: 'none' }, zIndex: 1201 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Aquatronics
          </Typography>
        </Toolbar>
      </AppBar>
      {/* Drawer for mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Permanent drawer for desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
