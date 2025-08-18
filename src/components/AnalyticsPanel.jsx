
import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, IconButton, CircularProgress, Alert } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);


const defaultKPIs = [
  { label: 'Total Logs', value: 0 },
  { label: 'Unique Users', value: 0 },
  { label: 'Avg Element Count', value: 0 },
  { label: 'Avg Total Quantity', value: 0 },
];

const AnalyticsPanel = ({ expanded = true, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [kpis, setKpis] = useState(defaultKPIs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendData, setTrendData] = useState(null);
  const [topElements, setTopElements] = useState(null);
  const [deviceTypeData, setDeviceTypeData] = useState(null);
  const [quantityTop5Data, setQuantityTop5Data] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('token');
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
        const statsResponse = await axios.get('/api/history/stats', config);
        const allResponse = await axios.get('/api/history/all?limit=500', config);
        const stats = statsResponse.data || {};
        setKpis([
          { label: 'Total Logs', value: stats.totalLogs || 0 },
          { label: 'Unique Users', value: stats.uniqueUsers || 0 },
          { label: 'Avg Element Count', value: stats.avgElementCount || 0 },
          { label: 'Avg Total Quantity', value: stats.avgTotalQuantity || 0 },
        ]);
        const logs = allResponse.data || [];
        // Trend: logs per day
        const trend = {};
        logs.forEach(log => {
          const d = new Date(log.timestamp).toLocaleDateString();
          trend[d] = (trend[d] || 0) + 1;
        });
        setTrendData({
          labels: Object.keys(trend),
          datasets: [{ label: 'Logs', data: Object.values(trend), borderColor: '#1976d2', backgroundColor: '#90caf9' }]
        });
        // Top 5 elements and quantity diff
        const elementCounts = {};
        const elementQuantities = {};
        logs.forEach(log => {
          (log.elements || []).forEach(e => {
            elementCounts[e.symbol] = (elementCounts[e.symbol] || 0) + 1;
            if (!elementQuantities[e.symbol]) {
              elementQuantities[e.symbol] = [];
            }
            if (typeof e.quantity === 'number') {
              elementQuantities[e.symbol].push(e.quantity);
            }
          });
        });
        const sorted = Object.entries(elementCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
        setTopElements({
          labels: sorted.map(([k])=>k),
          datasets: [{ label: 'Selections', data: sorted.map(([,v])=>v), backgroundColor: '#90caf9' }]
        });
        // Top 5 quantity values for each of the top 5 elements
        const top5QuantitiesPerElement = sorted.map(([symbol]) => {
          const quantities = (elementQuantities[symbol] || []).slice();
          quantities.sort((a, b) => b - a);
          // Pad with nulls if less than 5
          while (quantities.length < 5) quantities.push(null);
          return quantities.slice(0, 5);
        });
        // Prepare datasets: one for each rank (1st, 2nd, ... 5th highest)
        const quantityTop5Datasets = Array.from({ length: 5 }, (_, i) => ({
          label: `Top ${i + 1}`,
          data: top5QuantitiesPerElement.map(qArr => qArr[i]),
          backgroundColor: `hsl(${30 + i * 40}, 80%, 60%)`
        }));
        setQuantityTop5Data({
          labels: sorted.map(([k]) => k),
          datasets: quantityTop5Datasets
        });
        // Device type pie
        const typeCounts = {};
        logs.forEach(log => {
          if(log.transportMode) typeCounts[log.transportMode] = (typeCounts[log.transportMode]||0)+1;
        });
        setDeviceTypeData({
          labels: Object.keys(typeCounts),
          datasets: [{ data: Object.values(typeCounts), backgroundColor: ['#90caf9','#1976d2','#bdbdbd','#ffb300'] }]
        });
      } catch (err) {
        let msg = 'Failed to load analytics chart data';
        if (err.response) {
          msg += `: ${err.response.status} ${err.response.statusText}`;
          if (err.response.data && err.response.data.message) {
            msg += ` - ${err.response.data.message}`;
          }
        } else if (err.request) {
          msg += ': No response from server';
        } else if (err.message) {
          msg += `: ${err.message}`;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box mt={4} sx={{ border: '4px solid #1976d2', background: '#e3f2fd', borderRadius: 2, p: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>Analytics</Typography>
        <IconButton onClick={() => { setIsExpanded(e => !e); onToggle && onToggle(!isExpanded); }}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : isExpanded && (
        <Grid container spacing={2}>
          {/* KPI Cards */}
          {kpis.map((kpi, idx) => (
            <Grid item xs={6} md={3} key={kpi.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">{kpi.label}</Typography>
                  <Typography variant="h5">{kpi.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle2">Logs Per Day</Typography>
                {trendData ? <Line data={trendData} /> : <Typography>No data</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle2">Top 5 Elements</Typography>
                {topElements ? <Bar data={topElements} /> : <Typography>No data</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle2">Top 5 Quantities for Top 5 Elements</Typography>
                {quantityTop5Data ? <Bar data={quantityTop5Data} options={{ responsive: true, plugins: { legend: { display: true } } }} /> : <Typography>No data</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle2">Most Used Transport Mode</Typography>
                {deviceTypeData ? <Pie data={deviceTypeData} /> : <Typography>No data</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsPanel;
