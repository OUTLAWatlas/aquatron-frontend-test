import ObjectTable from '../components/ObjectTable';
// src/pages/HistoryPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  TableContainer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WifiIcon from '@mui/icons-material/Wifi';
import UsbIcon from '@mui/icons-material/Usb';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios'; // Import the configured API instance
import dayjs from 'dayjs';

const HistoryPage = () => {
  const { token, role, userId } = useAuth();
  const [logs, setLogs] = useState([]);
  const [logLimit, setLogLimit] = useState(10);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState(dayjs().subtract(7, 'day'));
  const [customEndDate, setCustomEndDate] = useState(dayjs());
  const [actionFilter, setActionFilter] = useState('');
  const [transportFilter, setTransportFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (transportFilter) params.append('transport', transportFilter);
      if (filterType === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate.toISOString());
        if (customEndDate) params.append('endDate', customEndDate.toISOString());
      }
      params.append('limit', logLimit);
      // Use the correct API endpoint
      const url = role === 'admin' || role === 'superadmin' 
        ? `/history/all?${params.toString()}` 
        : `/history/user?${params.toString()}`;
      const res = await api.get(url);
      setLogs(res.data);
      applyFilter(res.data, filterType);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError('Failed to fetch logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, token, filterType, actionFilter, transportFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [fetchLogs, token]);

  const applyFilter = (data, type) => {
    let filtered = [];
    const now = dayjs();

    switch (type) {
      case 'today':
        const todayStart = now.startOf('day');
        const todayEnd = now.endOf('day');
        filtered = data.filter(log => {
          const logDate = dayjs(log.timestamp);
          return logDate.isAfter(todayStart) && logDate.isBefore(todayEnd);
        });
        break;

      case '7days':
        const sevenDaysAgo = now.subtract(7, 'day');
        filtered = data.filter(log => dayjs(log.timestamp).isAfter(sevenDaysAgo));
        break;

      case '30days':
        const thirtyDaysAgo = now.subtract(30, 'day');
        filtered = data.filter(log => dayjs(log.timestamp).isAfter(thirtyDaysAgo));
        break;

      case 'custom':
        const start = customStartDate.startOf('day');
        const end = customEndDate.endOf('day');
        filtered = data.filter(log => {
          const logDate = dayjs(log.timestamp);
          return logDate.isAfter(start) && logDate.isBefore(end);
        });
        break;

      case 'alltime':
        filtered = data; // Show all logs
        break;

      default:
        filtered = data;
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (event) => {
    const newFilterType = event.target.value;
    setFilterType(newFilterType);
    applyFilter(logs, newFilterType);
  };

  const handleCustomDateChange = () => {
    applyFilter(logs, 'custom');
  };

  const handleActionFilterChange = (event) => {
    setActionFilter(event.target.value);
  };

  const handleTransportFilterChange = (event) => {
    setTransportFilter(event.target.value);
  };

  const toggleRowExpansion = (logId) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const getFilterDescription = () => {
    switch (filterType) {
      case 'today':
        return `Today (${dayjs().format('MMM DD, YYYY')})`;
      case '7days':
        return `Last 7 days (${dayjs().subtract(7, 'day').format('MMM DD')} - ${dayjs().format('MMM DD, YYYY')})`;
      case '30days':
        return `Last 30 days (${dayjs().subtract(30, 'day').format('MMM DD')} - ${dayjs().format('MMM DD, YYYY')})`;
      case 'custom':
        return `Custom range (${customStartDate.format('MMM DD, YYYY')} - ${customEndDate.format('MMM DD, YYYY')})`;
      case 'alltime':
        return 'All time';
      default:
        return 'All time';
    }
  };

  const getTransportIcon = (transport) => {
    switch (transport) {
      case 'wifi':
        return <WifiIcon fontSize="small" />;
      case 'uart':
        return <UsbIcon fontSize="small" />;
      case 'tcp':
        return <SettingsIcon fontSize="small" />;
      default:
        return <SettingsIcon fontSize="small" />;
    }
  };

  const getActionColor = (action) => {
    if (action.includes('SW Parameters')) return 'primary';
    if (action.includes('Settings')) return 'secondary';
    if (action.includes('Debug')) return 'warning';
    return 'default';
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Device ID', 'User', 'Action', 'Command', 'Transport', 'Elements', 'Element Count', 'Total Quantity', 'Timestamp', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.deviceId || 'N/A',
        log.user ? log.user.username : log.userId,
        log.action || 'Device Action',
        log.command || 'N/A',
        log.transportMode || 'auto',
        log.elements ? log.elements.map(el => `${el.symbol}:${el.quantity}`).join(';') : 'N/A',
        log.elementCount || 0,
        log.totalQuantity || 0,
        dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        log.deviceResponse?.success ? 'Success' : 'Failed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_logs_${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderElementDetails = (log) => {
    if (!log.elements || log.elements.length === 0) {
      return <Typography variant="body2" color="text.secondary">No elements data</Typography>;
    }

    return (
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Vout Base</TableCell>
              <TableCell>Frequency</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {log.elements.map((element, index) => (
              <TableRow key={index}>
                <TableCell><Chip label={element.symbol} size="small" /></TableCell>
                <TableCell>{element.name || element.symbol}</TableCell>
                <TableCell>{element.quantity}</TableCell>
                <TableCell>{element.vout_base}</TableCell>
                <TableCell>{element.freq}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Loading history...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchLogs} sx={{ mt: 2 }}>Retry</Button>
      </Paper>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Activity History</Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchLogs} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to CSV">
                <IconButton onClick={exportToCSV} disabled={filteredLogs.length === 0}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Enhanced Filter Controls */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={2}>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Log Limit</InputLabel>
                <Select
                  value={logLimit}
                  label="Log Limit"
                  onChange={e => setLogLimit(Number(e.target.value))}
                >
                  {[10, 50, 100, 150].map(val => (
                    <MenuItem key={val} value={val}>{val}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
              <FormControl fullWidth size="small">
                <InputLabel>Time Filter</InputLabel>
                <Select
                  value={filterType}
                  label="Time Filter"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                  <MenuItem value="alltime">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Action Filter</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action Filter"
                  onChange={handleActionFilterChange}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="Send SW Parameters">SW Parameters</MenuItem>
                  <MenuItem value="Set Device Settings">Device Settings</MenuItem>
                  <MenuItem value="Debug Packet">Debug</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Transport</InputLabel>
                <Select
                  value={transportFilter}
                  label="Transport"
                  onChange={handleTransportFilterChange}
                >
                  <MenuItem value="">All Transport</MenuItem>
                  <MenuItem value="wifi">WiFi</MenuItem>
                  <MenuItem value="uart">UART</MenuItem>
                  <MenuItem value="tcp">TCP</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {filterType === 'custom' &&
              <>
                <Grid item xs={12} sm={2}>
                  <DatePicker
                    label="Start Date"
                    value={customStartDate}
                    onChange={(newValue) => {
                      setCustomStartDate(newValue);
                      if (customEndDate) {
                        setTimeout(handleCustomDateChange, 100);
                      }
                    }}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    maxDate={customEndDate || dayjs()}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <DatePicker
                    label="End Date"
                    value={customEndDate}
                    onChange={(newValue) => {
                      setCustomEndDate(newValue);
                      if (customStartDate) {
                        setTimeout(handleCustomDateChange, 100);
                      }
                    }}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    minDate={customStartDate}
                    maxDate={dayjs()}
                  />
                </Grid>
              </>
            }

            <Grid item xs={12} sm={2}>
              <Chip 
                label={`${filteredLogs.length} logs found`} 
                color="primary" 
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Filter Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing: {getFilterDescription()}
          </Typography>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Transport</TableCell>
                <TableCell>Elements</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography>No logs found for the selected filters</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log, index) => (
                  <React.Fragment key={log._id || index}>
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxWidth: 120 }}>
                          {log.deviceId ? log.deviceId.replace(/(.{12})/g, '$1\n') : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {log.user ? log.user.username : log.userId}
                          </Typography>
                          {log.user && (
                            <Chip 
                              label={log.user.role} 
                              size="small" 
                              variant="outlined" 
                              color="secondary"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action || 'Device Action'} 
                          color={getActionColor(log.action)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getTransportIcon(log.transportMode)}
                          label={log.transportMode || 'auto'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {log.elementCount || 0} elements
                          </Typography>
                          {log.totalQuantity > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Total: {log.totalQuantity}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(log.timestamp).format('MMM DD, YYYY')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(log.timestamp).format('HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.deviceResponse?.success ? 'Success' : 'Failed'} 
                          color={log.deviceResponse?.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleRowExpansion(log._id || index)}
                        >
                          <ExpandMoreIcon 
                            sx={{ 
                              transform: expandedRows[log._id || index] ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }} 
                          />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row with Details */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedRows[log._id || index]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              Details
                            </Typography>
                            
                            {/* Elements Information */}
                            {log.elements && log.elements.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                  Elements Sent ({log.elementCount} total)
                                </Typography>
                                {renderElementDetails(log)}
                              </Box>
                            )}
                            
                            {/* Settings Information */}
                            {log.settings && Object.keys(log.settings).length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                  Device Settings
                                </Typography>
                                <ObjectTable data={log.settings} />
                              </Box>
                            )}
                            
                            {/* Device Response */}
                            {log.deviceResponse && (
                              <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                  Device Response
                                </Typography>
                                <Chip 
                                  label={log.deviceResponse.message || 'No message'} 
                                  color={log.deviceResponse.success ? 'success' : 'error'}
                                  variant="outlined"
                                />
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </LocalizationProvider>
  );
};

export default HistoryPage;
