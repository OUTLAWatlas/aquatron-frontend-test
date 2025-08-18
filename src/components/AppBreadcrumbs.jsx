import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useLocation, Link as RouterLink } from 'react-router-dom';

const pathNameMap = {
  '': 'Home',
  'device': 'Device Control',
  'history': 'History',
  'admin': 'Admin Panel',
  'login': 'Login',
  'signup': 'Sign Up',
  'forgot-password': 'Forgot Password',
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const AppBreadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <Link
        underline="hover"
        color={pathnames.length === 0 ? 'text.primary' : 'inherit'}
        component={RouterLink}
        to="/"
      >
        Home
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = pathNameMap[value] || capitalize(value);
        return isLast ? (
          <Typography color="text.primary" key={to}>
            {label}
          </Typography>
        ) : (
          <Link
            underline="hover"
            color="inherit"
            component={RouterLink}
            to={to}
            key={to}
          >
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default AppBreadcrumbs;
