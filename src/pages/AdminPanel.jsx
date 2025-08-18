import ObjectTable from '../components/ObjectTable';
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  PersonAdd as AddUserIcon,
  Delete as DeleteIcon,
  BugReport as DebugIcon,
  Settings as SettingsIcon,
  People as UsersIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  Science as ScienceIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import SortableTable from '../components/SortableTable';
import {
  exportDeviceSettingsOnly,
  importDeviceSettingsOnly,
  createComprehensiveTemplate,
  exportComprehensiveData,
  importComprehensiveData,
  exportSTPForDevice,
  createDataBackup,
  restoreFromBackup,
  compareDataSets,
  exportDataSummary
} from '../utils/excelUtils';

// TabPanel component defined outside to avoid scope issues
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '20px' }}>
    {value === index && children}
  </div>
);

const AdminPanel = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [deviceSettingsHelpOpen, setDeviceSettingsHelpOpen] = useState(false);
  const [swpHelpOpen, setSwpHelpOpen] = useState(false);
  const [deviceId, setDeviceId] = useState('default');
  const [deviceSettings, setDeviceSettings] = useState({
    freefall: 10,
    hptf: 500,
    harmonic: 0,
    duration_ms: 7000,
    vout_table: [
      { symbol: 'Li', vout_base: 3.71, freq: 2226 },
      { symbol: 'Ca', vout_base: 2.95, freq: 1765 },
      { symbol: 'Na', vout_base: 3.032, freq: 1818 },
      { symbol: 'Cl', vout_base: 3.916, freq: 2351 },
      { symbol: 'Fe', vout_base: 4.558, freq: 2739 },
      { symbol: 'Zn', vout_base: 4.167, freq: 2504 },
      { symbol: 'Cu', vout_base: 4.557, freq: 2739 },
      { symbol: 'Pb', vout_base: 3.321, freq: 1988 },
      { symbol: 'Mg', vout_base: 3.63, freq: 2175 },
      { symbol: 'Mn', vout_base: 4.497, freq: 2697 },
      { symbol: 'Cd', vout_base: 3.711, freq: 2228 },
      { symbol: 'K',  vout_base: 2.454, freq: 1466 },
      { symbol: 'B',  vout_base: 5.256, freq: 3161 },
      { symbol: 'F',  vout_base: 3.896, freq: 2340 },
      { symbol: 'Mo', vout_base: 4.147, freq: 2486 },
      { symbol: 'Ni', vout_base: 4.661, freq: 2797 },
      { symbol: 'Se', vout_base: 3.423, freq: 2052 },
      { symbol: 'Si', vout_base: 3.814, freq: 2287 },
      { symbol: 'Ag', vout_base: 4.043, freq: 2428 },
      { symbol: 'As', vout_base: 3.711, freq: 2228 },
      { symbol: 'Hg', vout_base: 3.568, freq: 2140 },
      { symbol: 'P',  vout_base: 3.402, freq: 2041 },
      { symbol: 'Al', vout_base: 4.065, freq: 2439 },
      { symbol: 'Cr', vout_base: 1.343, freq: 797 },
      { symbol: 'Co', vout_base: 4.66, freq: 2797 },
      { symbol: 'Ba', vout_base: 2.598, freq: 1554 },
      { symbol: 'Am', vout_base: 3.341, freq: 1999 },
      { symbol: 'NO', vout_base: 4.660, freq: 2797 }
    ]
  });
  const [swpData, setSwpData] = useState([
    { symbol: 'Li', name: 'Lithium', quantity: 100, vout_base: 3.71, freq: 2226 },
    { symbol: 'Ca', name: 'Calcium', quantity: 110, vout_base: 2.95, freq: 1765 },
    { symbol: 'Na', name: 'Sodium', quantity: 120, vout_base: 3.032, freq: 1818 },
    { symbol: 'Cl', name: 'Chlorine', quantity: 35, vout_base: 3.916, freq: 2351 },
    { symbol: 'Fe', name: 'Iron', quantity: 150, vout_base: 4.558, freq: 2739 },
    { symbol: 'Zn', name: 'Zinc', quantity: 85, vout_base: 4.167, freq: 2504 },
    { symbol: 'Cu', name: 'Copper', quantity: 90, vout_base: 4.557, freq: 2739 },
    { symbol: 'Pb', name: 'Lead', quantity: 60, vout_base: 3.321, freq: 1988 },
    { symbol: 'Mg', name: 'Magnesium', quantity: 60, vout_base: 3.63, freq: 2175 },
    { symbol: 'Mn', name: 'Manganese', quantity: 60, vout_base: 4.497, freq: 2697 },
    { symbol: 'Cd', name: 'Cadmium', quantity: 40, vout_base: 3.711, freq: 2228 },
    { symbol: 'K',  name: 'Potassium', quantity: 95, vout_base: 2.454, freq: 1466 },
    { symbol: 'B',  name: 'Boron', quantity: 40, vout_base: 5.256, freq: 3161 },
    { symbol: 'F',  name: 'Fluorine', quantity: 20, vout_base: 3.896, freq: 2340 },
    { symbol: 'Mo', name: 'Molybdenum', quantity: 30, vout_base: 4.147, freq: 2486 },
    { symbol: 'Ni', name: 'Nickel', quantity: 65, vout_base: 4.661, freq: 2797 },
    { symbol: 'Se', name: 'Selenium', quantity: 25, vout_base: 3.423, freq: 2052 },
    { symbol: 'Si', name: 'Silicon', quantity: 85, vout_base: 3.814, freq: 2287 },
    { symbol: 'Ag', name: 'Silver', quantity: 15, vout_base: 4.043, freq: 2428 },
    { symbol: 'As', name: 'Arsenic', quantity: 10, vout_base: 3.711, freq: 2228 },
    { symbol: 'Hg', name: 'Mercury', quantity: 5, vout_base: 3.568, freq: 2140 },
    { symbol: 'P',  name: 'Phosphorus', quantity: 45, vout_base: 3.402, freq: 2041 },
    { symbol: 'Al', name: 'Aluminum', quantity: 75, vout_base: 4.065, freq: 2439 },
    { symbol: 'Cr', name: 'Chromium', quantity: 75, vout_base: 1.343, freq: 797 },
    { symbol: 'Co', name: 'Cobalt', quantity: 55, vout_base: 4.66, freq: 2797 },
    { symbol: 'Ba', name: 'Barium', quantity: 20, vout_base: 2.598, freq: 1554 },
    { symbol: 'Am', name: 'Americium', quantity: 2, vout_base: 3.341, freq: 1999 },
    { symbol: 'NO', name: 'Nitric Oxide', quantity: 1, vout_base: 4.660, freq: 2797 }
  ]);
  const [debugHistory, setDebugHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [userDialog, setUserDialog] = useState({ open: false, mode: 'add', user: null });
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });

  const isSuperAdmin = role === 'superadmin';
  const deviceSettingsFileInputRef = useRef(null);
  const swpFileInputRef = useRef(null);
  const backupFileInputRef = useRef(null);
  const comparisonFileInputRef = useRef(null);

  // Excel import/export functions using utility functions
  const exportDeviceSettings = () => {
    try {
      const result = exportDeviceSettingsOnly(deviceSettings, 'device_settings.xlsx');

      if (result.success) {
        setSuccess('Device settings exported successfully!');
      } else {
        setError(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export device settings');
    }
  };

  const downloadTemplate = () => {
    try {
      const result = createComprehensiveTemplate('device_settings_template.xlsx', {
        includeInstructions: true,
        includeValidationRules: true
      });

      if (result.success) {
        setSuccess('Template downloaded successfully!');
      } else {
        setError(`Template download failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Template download error:', error);
      setError('Failed to download template');
    }
  };

  const importDeviceSettings = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size too large. Please select a file smaller than 10MB');
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await importDeviceSettingsOnly(file);

      if (result.success) {
        // Update device settings
        if (result.deviceSettings && Object.keys(result.deviceSettings).length > 0) {
          setDeviceSettings(prev => ({ ...prev, ...result.deviceSettings }));
        }

        // Update Vout table
        if (result.voutTable && result.voutTable.length > 0) {
          setDeviceSettings(prev => ({
            ...prev,
            vout_table: result.voutTable
          }));
        }

        setSuccess(`Device settings imported successfully! Imported ${Object.keys(result.deviceSettings || {}).length} settings and ${result.voutTable?.length || 0} vout table entries.`);
      } else {
        setError(`Import failed: ${result.message}`);
      }

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import device settings. Please check the file format.');
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  // SWP import/export functions using utility functions
  const exportSWP = () => {
    try {
      const result = exportComprehensiveData({}, swpData, 'swp_parameters.xlsx', {
        includeValidation: true,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setSuccess(`SWP parameters exported successfully! Exported ${swpData.length} parameters.`);
      } else {
        setError(`Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export SWP parameters');
    }
  };

  const importSWP = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size too large. Please select a file smaller than 10MB');
      event.target.value = '';
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await importComprehensiveData(file, {
        validateData: true,
        allowUnknownParameters: false
      });

      if (result.success && result.stpData && result.stpData.length > 0) {
        setSwpData(result.stpData);
        setSuccess(`SWP parameters imported successfully! Imported ${result.stpData.length} parameters.`);
        
        // Show validation warnings if any
        if (result.warnings && result.warnings.length > 0) {
          setError(`Import completed with warnings: ${result.warnings.join(', ')}`);
        }
      } else {
        setError('No valid SWP data found in the Excel file');
      }

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import SWP parameters. Please check the file format.');
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  const downloadSWPTemplate = () => {
    try {
      const result = createComprehensiveTemplate('swp_template.xlsx', {
        includeInstructions: true,
        includeValidationRules: true
      });

      if (result.success) {
        setSuccess('SWP template downloaded successfully!');
      } else {
        setError(`Template download failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Template download error:', error);
      setError('Failed to download SWP template');
    }
  };

  // Send SWP data to device
  const sendSWPToDevice = async () => {
    try {
      setLoading(true);

      // Prepare SWP data for device communication
      const swpElements = swpData.map(item => ({
        symbol: item.symbol,
        quantity: item.quantity,
        vout_base: item.vout_base,
        freq: item.freq
      }));

      // Send to device
      const response = await api.post('/device/sw-parameters', { 
        elements: swpElements,
        deviceId: deviceId
      });

      if (response.data.success) {
        setSuccess('SWP parameters sent to device successfully!');
      } else {
        setError('Failed to send SWP parameters to device');
      }
    } catch (error) {
      console.error('Error sending SWP to device:', error);
      setError('Failed to send SWP parameters to device');
    } finally {
      setLoading(false);
    }
  };

  // Table column definitions
  const usersColumns = [
    { id: 'username', label: 'Username', width: 150 },
    { id: 'email', label: 'Email', width: 250 },
    { id: 'role', label: 'Role', width: 120,
      render: (value) => (
        <Chip
          label={value || 'user'}
          color={value === 'superadmin' ? 'error' : value === 'admin' ? 'warning' : 'default'}
        />
      )
    },
    { id: 'actions', label: 'Actions', width: 200, align: 'center', sortable: false,
      render: (value, row) => (
        <Box>
          <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
            <Select
              value={row?.role || 'user'}
              onChange={(e) => handleUpdateUserRole(row?._id, e.target.value)}
                disabled={row?.role === 'superadmin'}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          {row?.role !== 'superadmin' && (
            <Tooltip title="Delete User">
              <IconButton
                color="error"
                onClick={() => handleDeleteUser(row?._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    },
  ];

  const debugHistoryColumns = [
    { id: 'timestamp', label: 'Timestamp', width: 180,
      render: (value) => new Date(value).toLocaleString()
    },
    { id: 'cmd', label: 'Command', width: 100,
      render: (value) => `0x${value}`
    },
    { id: 'payload', label: 'Payload', width: 150,
      render: (value) => value || 'None'
    },
    { id: 'description', label: 'Description', width: 200 },
    { id: 'response', label: 'Response', width: 300,
      render: (value) => value ? <ObjectTable data={value} /> : 'No response'
    },
  ];

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      // Filter out superadmin users from the list
      const filteredUsers = (response.data || []).filter(user => user.role !== 'superadmin');
      setUsers(filteredUsers);
    } catch (err) {
      setError('Failed to fetch users: ' + err.response?.data?.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch device settings
  const fetchDeviceSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/device/settings');
      if (response.data) {
        // Ensure vout_table is always an array
        const settings = response.data;
        if (!settings.vout_table || !Array.isArray(settings.vout_table)) {
          settings.vout_table = [
            { symbol: 'H', vout_base: 1.0, freq: 600 },
            { symbol: 'He', vout_base: 1.1, freq: 660 },
            { symbol: 'Li', vout_base: 3.71, freq: 2226 },
            { symbol: 'Be', vout_base: 1.2, freq: 720 },
            { symbol: 'B', vout_base: 1.3, freq: 780 },
            { symbol: 'C', vout_base: 1.4, freq: 840 },
            { symbol: 'N', vout_base: 1.5, freq: 900 },
            { symbol: 'O', vout_base: 1.6, freq: 960 },
            { symbol: 'F', vout_base: 1.7, freq: 1020 },
            { symbol: 'Ne', vout_base: 1.8, freq: 1080 },
            { symbol: 'Na', vout_base: 3.032, freq: 1818 },
            { symbol: 'Mg', vout_base: 2.0, freq: 1200 },
            { symbol: 'Al', vout_base: 2.1, freq: 1260 },
            { symbol: 'Si', vout_base: 2.2, freq: 1320 },
            { symbol: 'P', vout_base: 2.3, freq: 1380 },
            { symbol: 'S', vout_base: 2.4, freq: 1440 },
            { symbol: 'Cl', vout_base: 3.916, freq: 2351 },
            { symbol: 'Ar', vout_base: 2.6, freq: 1560 },
            { symbol: 'K', vout_base: 2.7, freq: 1620 },
            { symbol: 'Ca', vout_base: 2.95, freq: 1765 },
            { symbol: 'Sc', vout_base: 2.9, freq: 1740 },
            { symbol: 'Ti', vout_base: 3.0, freq: 1800 },
            { symbol: 'V', vout_base: 3.1, freq: 1860 },
            { symbol: 'Cr', vout_base: 3.2, freq: 1920 },
            { symbol: 'Mn', vout_base: 3.3, freq: 1980 },
            { symbol: 'Fe', vout_base: 4.558, freq: 2739 },
            { symbol: 'Co', vout_base: 3.5, freq: 2100 },
            { symbol: 'Ni', vout_base: 3.6, freq: 2160 },
            { symbol: 'Cu', vout_base: 3.7, freq: 2220 },
            { symbol: 'Zn', vout_base: 3.8, freq: 2280 }
          ];
        }
        setDeviceSettings(settings);
      }
    } catch (err) {
      setError('Failed to fetch device settings: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  // Get deviceId from socket events
  useEffect(() => {
    const socket = require('../socket').getSocket();
    socket.on('device-status', (data) => {
      if (data.deviceId) {
        setDeviceId(data.deviceId);
      }
    });
    socket.on('device-data', (data) => {
      if (data.deviceId) {
        setDeviceId(data.deviceId);
      }
    });
    
    return () => {
      socket.off('device-status');
      socket.off('device-data');
    };
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchUsers();
    } else if (activeTab === 1) {
      fetchDeviceSettings();
    }
  }, [activeTab]);

  // Check if user has admin access
  if (role !== 'admin' && role !== 'superadmin') {
    return (
      <Box p={3}>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Box>
    );
  }

  // User management functions
  const handleAddUser = async () => {
    try {
      // Ensure newUser has all required fields
      const userData = {
        username: newUser.username || '',
        email: newUser.email || '',
        password: newUser.password || '',
        role: newUser.role || 'user'
      };
      await api.post('/users', userData);
      setSuccess('User added successfully');
      setUserDialog({ open: false, mode: 'add', user: null });
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setError('Failed to add user: ' + err.response?.data?.message);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to update user role: ' + err.response?.data?.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isSuperAdmin) return;

    try {
      await api.delete(`/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user: ' + err.response?.data?.message);
    }
  };

  // Device settings functions
  const handleUpdateDeviceSettings = async () => {
    try {
      // Ensure vout_table is always an array before sending
      const settingsToSend = {
        ...deviceSettings,
        vout_table: deviceSettings.vout_table || []
      };
      await api.post('/device/settings', {
        ...settingsToSend,
        deviceId: deviceId
      });
      setSuccess('Device settings updated successfully');
    } catch (err) {
      setError('Failed to update device settings: ' + err.response?.data?.message);
    }
  };

  const handleVoutTableChange = (index, field, value) => {
    const currentVoutTable = deviceSettings.vout_table || [];
    const updatedVoutTable = [...currentVoutTable];
    updatedVoutTable[index] = { ...updatedVoutTable[index], [field]: value };
    setDeviceSettings({ ...deviceSettings, vout_table: updatedVoutTable });
  };

  const addVoutEntry = () => {
    const currentVoutTable = deviceSettings.vout_table || [];
    setDeviceSettings({
      ...deviceSettings,
      vout_table: [...currentVoutTable, { symbol: 'Li', vout_base: 1.0, freq: 1000 }]
    });
  };

  const removeVoutEntry = (index) => {
    const currentVoutTable = deviceSettings.vout_table || [];
    const updatedVoutTable = currentVoutTable.filter((_, i) => i !== index);
    setDeviceSettings({ ...deviceSettings, vout_table: updatedVoutTable });
  };

  // Debug functions
  const sendDebugPacket = async (cmd, payload, description) => {
    try {
      // Ensure debugPacket has all required fields
      const packetData = {
        cmd: parseInt(cmd || '0', 16),
        payload: payload || '',
        description: description || ''
      };
      const response = await api.post('/device/debug', {
        ...packetData,
        deviceId: deviceId
      });

      setDebugHistory(prev => [{
        timestamp: new Date().toISOString(),
        cmd: cmd || '',
        payload: payload || '',
        description: description || '',
        response: response.data
      }, ...prev]);

      setSuccess('Debug packet sent successfully');
    } catch (err) {
      setError('Failed to send debug packet: ' + err.response?.data?.message);
    }
  };

  // Additional Excel utility functions
  const createBackup = () => {
    try {
      const backupData = {
        deviceSettings,
        stpData: swpData,
        voutTable: deviceSettings.vout_table || []
      };
      
      const result = createDataBackup(backupData);
      
      if (result.success) {
        setSuccess('Data backup created successfully!');
      } else {
        setError(`Backup failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Backup error:', error);
      setError('Failed to create backup');
    }
  };

  const restoreBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await restoreFromBackup(file);

      if (result.success) {
        // Update device settings
        if (result.deviceSettings && Object.keys(result.deviceSettings).length > 0) {
          setDeviceSettings(prev => ({ ...prev, ...result.deviceSettings }));
        }

        // Update Vout table
        if (result.voutTable && result.voutTable.length > 0) {
          setDeviceSettings(prev => ({
            ...prev,
            vout_table: result.voutTable
          }));
        }

        // Update SWP data
        if (result.stpData && result.stpData.length > 0) {
          setSwpData(result.stpData);
        }

        setSuccess(`Backup restored successfully! Restored ${Object.keys(result.deviceSettings || {}).length} device settings, ${result.voutTable?.length || 0} vout table entries, and ${result.stpData?.length || 0} SWP parameters.`);
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          setError(`Restore completed with warnings: ${result.warnings.join(', ')}`);
        }
      } else {
        setError(`Restore failed: ${result.message}`);
      }

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Restore error:', error);
      setError('Failed to restore from backup. Please check the file format.');
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  const exportSummary = () => {
    try {
      const summaryData = {
        deviceSettings,
        stpData: swpData,
        voutTable: deviceSettings.vout_table || []
      };
      
      const result = exportDataSummary(summaryData);
      
      if (result.success) {
        setSuccess('Data summary exported successfully!');
      } else {
        setError(`Summary export failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Summary export error:', error);
      setError('Failed to export data summary');
    }
  };

  const compareWithCurrent = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await importComprehensiveData(file, {
        validateData: true,
        allowUnknownParameters: false
      });

      if (result.success) {
        const currentData = {
          deviceSettings,
          stpData: swpData,
          voutTable: deviceSettings.vout_table || []
        };

        const comparison = compareDataSets(currentData, result);

        if (comparison.success) {
          const { differences } = comparison;
          const { summary } = differences;
          
          if (summary.totalChanges === 0) {
            setSuccess('No differences found between current data and imported file.');
          } else {
            setSuccess(`Found ${summary.totalChanges} differences: ${summary.deviceSettingsChanges} device settings, ${summary.stpDataChanges} STP parameters, ${summary.voutTableChanges} vout table entries.`);
            
            // Show detailed differences in console for debugging
            console.log('Data differences:', differences);
          }
        } else {
          setError('Failed to compare datasets');
        }
      } else {
        setError('Failed to read file for comparison');
      }

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Comparison error:', error);
      setError('Failed to compare datasets');
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3} sx={{ fontWeight: 700, color: '#1565c0' }}>
        Admin Panel
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>Loading...</Alert>
      )}

      <Paper elevation={2}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab
            icon={<UsersIcon />}
            label="User Management"
            iconPosition="start"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Device Settings"
            iconPosition="start"
          />
          <Tab
            icon={<ScienceIcon />}
            label="SWP Management"
            iconPosition="start"
          />
          {isSuperAdmin && (
            <Tab
              icon={<DebugIcon />}
              label="Debug Panel"
              iconPosition="start"
            />
          )}
        </Tabs>

        {/* User Management Tab */}
        <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">User Management</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddUserIcon />}
                  onClick={() => setUserDialog({ open: true, mode: 'add', user: null })}
                >
                  Add User
                </Button>
              </Box>

              <SortableTable
                title="Users"
                columns={usersColumns}
                data={users}
                defaultSort="username"
                showIndex={true}
              />
            </Box>
          </TabPanel>


        {/* Device Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Device Settings Management</Typography>
              <Button
                variant="outlined"
                onClick={() => setDeviceSettingsHelpOpen(true)}
                size="small"
                sx={{ 
                  minWidth: 'auto', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  p: 0
                }}
              >
                i
              </Button>
            </Box>

            {/* Import/Export Buttons */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportDeviceSettings}
                sx={{ minWidth: 150 }}
              >
                Export to Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => deviceSettingsFileInputRef.current?.click()}
                sx={{ minWidth: 150 }}
              >
                Import from Excel
              </Button>
              <Button
                variant="outlined"
                onClick={downloadTemplate}
                sx={{ minWidth: 150 }}
              >
                Download Template
              </Button>
              <input
                ref={deviceSettingsFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={importDeviceSettings}
                style={{ display: 'none' }}
              />
            </Box>

            {/* Info Button for Device Settings Help */}
            {/* This block is now moved to the header */}



            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Basic Device Settings</Typography>

                    {/* Device Settings Table */}
                                         <SortableTable
                       columns={[
                         { id: 'setting', label: 'Setting', sortable: true, editable: false },
                         {
                           id: 'value',
                           label: 'Value',
                           align: 'center',
                           sortable: true,
                           editable: true,
                           type: 'number',
                           inputProps: { min: 0 }
                         },
                         {
                           id: 'unit',
                           label: 'Unit',
                           align: 'center',
                           sortable: true,
                           editable: false
                         }
                       ]}
                       data={[
                         { setting: 'Freefall', value: deviceSettings?.freefall || 10, unit: 'ms' },
                         { setting: 'HPTF', value: deviceSettings?.hptf || 500, unit: 'Hz' },
                         { setting: 'Harmonic', value: deviceSettings?.harmonic || 0, unit: '' },
                         { setting: 'Duration', value: deviceSettings?.duration_ms || 7000, unit: 'ms' }
                       ]}
                       editable={true}
                       onEdit={(rowIndex, columnId, value) => {
                         const settings = [...deviceSettings];
                         const settingKeys = ['freefall', 'hptf', 'harmonic', 'duration_ms'];
                         const key = settingKeys[rowIndex];
                         if (key) {
                           setDeviceSettings({...deviceSettings, [key]: parseInt(value)});
                         }
                       }}
                       permissions={{
                         canEdit: true,
                         canDelete: false,
                         canAdd: false
                       }}
                       showPagination={true}
                       defaultRowsPerPage={5}
                     />

                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={handleUpdateDeviceSettings}
                        disabled={loading}
                      fullWidth
                      >
                        {loading ? 'Updating...' : 'Update Device Settings'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" mb={2}>Vout Table Configuration</Typography>

                    {/* Vout Table */}
                                         <SortableTable
                       columns={[
                         {
                           id: 'symbol',
                           label: 'Symbol',
                           sortable: true,
                           editable: true,
                           type: 'select',
                           options: [
                             { value: 'H', label: 'H' },
                             { value: 'He', label: 'He' },
                             { value: 'Li', label: 'Li' },
                             { value: 'Be', label: 'Be' },
                             { value: 'B', label: 'B' },
                             { value: 'C', label: 'C' },
                             { value: 'N', label: 'N' },
                             { value: 'O', label: 'O' },
                             { value: 'F', label: 'F' },
                             { value: 'Ne', label: 'Ne' },
                             { value: 'Na', label: 'Na' },
                             { value: 'Mg', label: 'Mg' },
                             { value: 'Al', label: 'Al' },
                             { value: 'Si', label: 'Si' },
                             { value: 'P', label: 'P' },
                             { value: 'S', label: 'S' },
                             { value: 'Cl', label: 'Cl' },
                             { value: 'Ar', label: 'Ar' },
                             { value: 'K', label: 'K' },
                             { value: 'Ca', label: 'Ca' },
                             { value: 'Sc', label: 'Sc' },
                             { value: 'Ti', label: 'Ti' },
                             { value: 'V', label: 'V' },
                             { value: 'Cr', label: 'Cr' },
                             { value: 'Mn', label: 'Mn' },
                             { value: 'Fe', label: 'Fe' },
                             { value: 'Co', label: 'Co' },
                             { value: 'Ni', label: 'Ni' },
                             { value: 'Cu', label: 'Cu' },
                             { value: 'Zn', label: 'Zn' }
                           ]
                         },
                         {
                           id: 'vout_base',
                           label: 'Vout (V)',
                           align: 'center',
                           sortable: true,
                           editable: true,
                           type: 'number',
                           inputProps: { step: 0.001, min: 0 }
                         },
                         {
                           id: 'freq',
                           label: 'Freq (Hz)',
                           align: 'center',
                           sortable: true,
                           editable: true,
                           type: 'number',
                           inputProps: { min: 1 }
                         }
                       ]}
                       data={deviceSettings.vout_table || []}
                       editable={true}
                       onEdit={(rowIndex, columnId, value) => {
                         handleVoutTableChange(rowIndex, columnId, value);
                       }}
                       onDelete={(rowIndex) => {
                         removeVoutEntry(rowIndex);
                       }}
                       onAdd={() => {
                         addVoutEntry();
                       }}
                       permissions={{
                         canEdit: true,
                         canDelete: true,
                         canAdd: true
                       }}
                       showIndex={true}
                       showPagination={true}
                       defaultRowsPerPage={5}
                     />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleUpdateDeviceSettings}
                disabled={loading}
              >
                Update Device Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* SWP Management Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Software Parameters (SWP) Management</Typography>
              <Button
                variant="outlined"
                onClick={() => setSwpHelpOpen(true)}
                size="small"
                sx={{ 
                  minWidth: 'auto', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  p: 0
                }}
              >
                i
              </Button>
            </Box>

            {/* Import/Export Buttons */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportSWP}
                sx={{ minWidth: 150 }}
              >
                Export SWP to Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => swpFileInputRef.current?.click()}
                sx={{ minWidth: 150 }}
              >
                Import SWP from Excel
              </Button>
              <Button
                variant="outlined"
                onClick={downloadSWPTemplate}
                sx={{ minWidth: 150 }}
              >
                Download SWP Template
              </Button>
              
              <input
                ref={swpFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={importSWP}
                style={{ display: 'none' }}
              />
              <input
                ref={comparisonFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={compareWithCurrent}
                style={{ display: 'none' }}
              />
            </Box>

            {/* Info Button for SWP Help */}
            {/* This block is now moved to the header */}



            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" mb={2}>Software Parameters Table</Typography>

                <SortableTable
                  columns={[
                    {
                      id: 'symbol',
                      label: 'Symbol',
                      sortable: true,
                      editable: true,
                      type: 'select',
                      options: [
                        { value: 'H', label: 'H' },
                        { value: 'He', label: 'He' },
                        { value: 'Li', label: 'Li' },
                        { value: 'Be', label: 'Be' },
                        { value: 'B', label: 'B' },
                        { value: 'C', label: 'C' },
                        { value: 'N', label: 'N' },
                        { value: 'O', label: 'O' },
                        { value: 'F', label: 'F' },
                        { value: 'Ne', label: 'Ne' },
                        { value: 'Na', label: 'Na' },
                        { value: 'Mg', label: 'Mg' },
                        { value: 'Al', label: 'Al' },
                        { value: 'Si', label: 'Si' },
                        { value: 'P', label: 'P' },
                        { value: 'S', label: 'S' },
                        { value: 'Cl', label: 'Cl' },
                        { value: 'Ar', label: 'Ar' },
                        { value: 'K', label: 'K' },
                        { value: 'Ca', label: 'Ca' },
                        { value: 'Sc', label: 'Sc' },
                        { value: 'Ti', label: 'Ti' },
                        { value: 'V', label: 'V' },
                        { value: 'Cr', label: 'Cr' },
                        { value: 'Mn', label: 'Mn' },
                        { value: 'Fe', label: 'Fe' },
                        { value: 'Co', label: 'Co' },
                        { value: 'Ni', label: 'Ni' },
                        { value: 'Cu', label: 'Cu' },
                        { value: 'Zn', label: 'Zn' }
                      ]
                    },
                    {
                      id: 'name',
                      label: 'Name',
                      sortable: true,
                      editable: true,
                      type: 'text'
                    },
                    {
                      id: 'quantity',
                      label: 'Quantity',
                      align: 'center',
                      sortable: true,
                      editable: true,
                      type: 'number',
                      inputProps: { min: 1, max: 100 }
                    },
                    {
                      id: 'vout_base',
                      label: 'Vout (V)',
                      align: 'center',
                      sortable: true,
                      editable: true,
                      type: 'number',
                      inputProps: { step: 0.001, min: 0 }
                    },
                    {
                      id: 'freq',
                      label: 'Freq (Hz)',
                      align: 'center',
                      sortable: true,
                      editable: true,
                      type: 'number',
                      inputProps: { min: 1 }
                    }
                  ]}
                  data={swpData}
                  editable={true}
                  onEdit={(rowIndex, columnId, value) => {
                    const newSwpData = [...swpData];
                    newSwpData[rowIndex][columnId] = value;
                    setSwpData(newSwpData);
                  }}
                  onDelete={(rowIndex) => {
                    const newSwpData = swpData.filter((_, i) => i !== rowIndex);
                    setSwpData(newSwpData);
                  }}
                  onAdd={() => {
                    setSwpData([...swpData, { symbol: 'Li', name: 'Lithium', quantity: 100, vout_base: 3.71, freq: 2226 }]);
                  }}
                  permissions={{
                    canEdit: true,
                    canDelete: true,
                    canAdd: true
                  }}
                  showIndex={true}
                  showPagination={true}
                  defaultRowsPerPage={5}
                />
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={sendSWPToDevice}
                disabled={loading || swpData.length === 0}
                fullWidth
              >
                {loading ? 'Sending...' : 'Send SWP to Device'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Debug Panel Tab */}
        {isSuperAdmin && (
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" mb={2}>Debug Panel</Typography>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>Send Preset Packets</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x01', '', 'CMD_DEVICE_ONLINE')}
                        sx={{ mb: 1 }}
                      >
                        Device Online (0x01)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x02', '', 'CMD_GET_DEVICE_READY')}
                        sx={{ mb: 1 }}
                      >
                        Get Device Ready (0x02)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x03', '', 'CMD_DEVICE_IS_READY')}
                        sx={{ mb: 1 }}
                      >
                        Device Is Ready (0x03)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x04', '', 'CMD_SEND_SW_PARAMETERS')}
                        sx={{ mb: 1 }}
                      >
                        Send SW Parameters (0x04)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x05', '', 'CMD_DATA_ACK')}
                        sx={{ mb: 1 }}
                      >
                        Data ACK (0x05)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x06', '', 'CMD_SET_DEVICE_SETTINGS')}
                        sx={{ mb: 1 }}
                      >
                        Set Device Settings (0x06)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x07', '', 'CMD_GET_DEVICE_SETTINGS')}
                        sx={{ mb: 1 }}
                      >
                        Get Device Settings (0x07)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => sendDebugPacket('0x08', '', 'CMD_DEVICE_SETTINGS')}
                        sx={{ mb: 1 }}
                      >
                        Device Settings (0x08)
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Debug History</Typography>
                  <SortableTable
                    title="Debug History"
                    columns={debugHistoryColumns}
                    data={debugHistory}
                    defaultSort="timestamp"
                    defaultOrder="desc"
                  />
                  {(debugHistory || []).length === 0 && (
                    <Typography color="text.secondary">No debug packets sent yet.</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
        )}
      </Paper>

      {/* Add User Dialog */}
      <Dialog open={userDialog.open} onClose={() => setUserDialog({ open: false, mode: 'add', user: null })}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={newUser?.username || ''}
            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser?.email || ''}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newUser?.password || ''}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser?.role || 'user'}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog({ open: false, mode: 'add', user: null })}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Device Settings Help Modal */}
      {deviceSettingsHelpOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setDeviceSettingsHelpOpen(false)}
        >
          <Box
            sx={{
              bgcolor: 'white',
              p: 3,
              borderRadius: 2,
              maxWidth: 600,
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: 3
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Excel Format Help
              </Typography>
              <Button
                onClick={() => setDeviceSettingsHelpOpen(false)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                ✕
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              <strong>Excel Format:</strong> The exported/imported Excel file contains two sheets:
              <br /><br />
              <strong>Basic Settings:</strong> Freefall, HPTF, Harmonic, and Duration parameters
              <br /><br />
              <strong>Vout Table:</strong> Element symbols with their corresponding vout_base and frequency values
              <br /><br />
              Use the template to see the expected format before importing.
            </Typography>
          </Box>
        </Box>
      )}

      {/* SWP Help Modal */}
      {swpHelpOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSwpHelpOpen(false)}
        >
          <Box
            sx={{
              bgcolor: 'white',
              p: 3,
              borderRadius: 2,
              maxWidth: 600,
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: 3
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                SWP Excel Format Help
              </Typography>
              <Button
                onClick={() => setSwpHelpOpen(false)}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                ✕
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              <strong>SWP Excel Format:</strong> The exported/imported Excel file contains one sheet with columns:
              <br /><br />
              <strong>symbol:</strong> Element symbol (e.g., Li, Fe, Cu)
              <br /><br />
              <strong>name:</strong> Element name (e.g., Lithium, Iron, Copper)
              <br /><br />
              <strong>quantity:</strong> Test quantity (1-100)
              <br /><br />
              <strong>vout_base:</strong> Voltage output base value
              <br /><br />
              <strong>freq:</strong> Frequency value in Hz
              <br /><br />
              Use the template to see the expected format before importing.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdminPanel;
