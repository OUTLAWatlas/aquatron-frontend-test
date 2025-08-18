import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import Dashboard from './pages/Dashboard';
import DeviceControl from './pages/DeviceControl';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import AdminPanel from './pages/AdminPanel';
import AnalyticsPage from './pages/AnalyticsPage';
import { Box, Drawer, List, ListItem, ListItemText, Typography } from '@mui/material';
import HistoryPage from './pages/historyPage';
import AppBreadcrumbs from './components/AppBreadcrumbs';

const drawerWidth = 220;

const Sidebar = () => {
  const { token, logout, role } = useAuth();
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: '#0a1929',
          color: '#e3f2fd',
          position: 'relative',
        },
      }}
    >
      <Box sx={{ height: 8 }} />
      <Box sx={{ textAlign: 'center', mt: 0, mb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 1000, color: 'primary.light', letterSpacing: 2, fontSize: '2rem' }}>
          AQUATRON
        </Typography>
      </Box>
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem button component={Link} to="/">
            <ListItemText primary={<span style={{ color: '#00bcd4', fontWeight: 700 }}>Home</span>} />
          </ListItem>
          <ListItem button component={Link} to="/device">
            <ListItemText primary={<span style={{ color: '#00bcd4', fontWeight: 700 }}>Device Control</span>} />
          </ListItem>
          <ListItem button component={Link} to="/history">
            <ListItemText primary={<span style={{ color: '#00bcd4', fontWeight: 700 }}>History</span>} />
          </ListItem>
          <ListItem button component={Link} to="/analytics">
            <ListItemText primary={<span style={{ color: '#00bcd4', fontWeight: 700 }}>Analytics</span>} />
          </ListItem>
          {(role === 'admin' || role === 'superadmin') && (
            <ListItem button component={Link} to="/admin">
              <ListItemText primary={<span style={{ color: '#00bcd4', fontWeight: 700 }}>Admin Panel</span>} />
            </ListItem>
          )}
          {token && (
            <ListItem button onClick={logout}>
              <ListItemText primary={<span style={{ color: '#00bcd4', fontWeight: 700 }}>Logout</span>} />
            </ListItem>
          )}
        </List>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 16, left: 0, width: '100%', textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{ cursor: 'pointer', userSelect: 'none', display: 'block' }}
          onDoubleClick={() => setShowEasterEgg((v) => !v)}
        >
          {showEasterEgg ? 'WirelessMind' : 'Version 1.0'}
        </Typography>
      </Box>
    </Drawer>
  );
};

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const MainLayout = ({ children }) => (
  <Box sx={{ display: 'flex', minHeight: '100vh', background: '#101624' }}>
    <Sidebar />
    <Box component="main" sx={{ flexGrow: 1, p: 0, background: '#101624', minHeight: '100vh' }}>
      <Box sx={{ p: 3 }}>
        <AppBreadcrumbs />
        {children}
      </Box>
    </Box>
  </Box>
);


const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/history" element={<PrivateRoute><MainLayout><HistoryPage /></MainLayout></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<PrivateRoute><MainLayout><Dashboard /></MainLayout></PrivateRoute>} />
          <Route path="/device" element={<PrivateRoute><MainLayout><DeviceControl /></MainLayout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><MainLayout><AdminPanel /></MainLayout></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><MainLayout><AnalyticsPage /></MainLayout></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
