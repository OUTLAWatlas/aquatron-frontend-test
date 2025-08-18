import React from 'react';
import { Box, Typography } from '@mui/material';
import AnalyticsPanel from '../components/AnalyticsPanel';

const AnalyticsPage = () => (
  <Box p={3}>
    <Typography variant="h4" mb={2}>Analytics Dashboard</Typography>
    <AnalyticsPanel />
  </Box>
);

export default AnalyticsPage;
