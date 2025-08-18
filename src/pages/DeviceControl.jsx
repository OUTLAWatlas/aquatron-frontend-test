import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  Button, 
  Grid,
  Card,
  CardContent,
  Chip,
  ButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Send as SendIcon,
  Settings as SettingsIcon,
  Science as ScienceIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  Search as SearchIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../api/axios';
import { getSocket } from '../socket';
import { useAuth } from '../auth/AuthContext';
import SortableTable from '../components/SortableTable';
import { 
  exportComprehensiveData, 
  importComprehensiveData, 
  createComprehensiveTemplate, 
  exportSTPForDevice
} from '../utils/excelUtils';
import * as XLSX from 'xlsx';
import { connectBluetooth, sendBluetoothData } from '../utils/bluetooth';

const DeviceControl = () => {
  const { role } = useAuth();
  const [deviceSettings, setDeviceSettings] = useState({});
  const [elementChecklist, setElementChecklist] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSentData, setLastSentData] = useState(null);
  const fileInputRef = useRef(null);
  const [transportMode, setTransportMode] = useState('auto');
  const [transportLoading, setTransportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [deviceId, setDeviceId] = useState('default');
  const [bluetoothCharacteristic, setBluetoothCharacteristic] = useState(null);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);

  // Get deviceId from socket events
  useEffect(() => {
    const socket = getSocket();
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

  // Filter elements based on search term
  const filteredElements = useMemo(() => {
    if (!searchTerm.trim()) return elementChecklist;
    return elementChecklist.filter(element =>
      element.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [elementChecklist, searchTerm]);

  // Utility and handler functions used in JSX
  const getSelectedElementsFromChecklist = () => {
    return elementChecklist
      .filter(item => item.checked)
      .map(item => ({
        symbol: item.symbol,
        name: item.name,
        quantity: item.quantity,
        vout_base: item.vout_base,
        freq: item.freq
      }));
  };

  const handleChecklistChange = (symbol, checked) => {
    setElementChecklist(prev => {
      // First update the checked status
      const updatedChecklist = prev.map(item =>
        item.symbol === symbol ? { ...item, checked } : item
      );
      
      // Then sort: checked items first, then unchecked items
      return updatedChecklist.sort((a, b) => {
        if (a.checked && !b.checked) return -1;
        if (!a.checked && b.checked) return 1;
        return 0; // Keep original order within each group
      });
    });
  };

  const handleChecklistQuantityChange = (symbol, quantity) => {
    setElementChecklist(prev =>
      prev.map(item =>
        item.symbol === symbol ? { ...item, quantity: Number(quantity) } : item
      )
    );
  };

  const handleCustomQtyChange = (symbol, quantity) => {
    setElementChecklist(prev =>
      prev.map(item =>
        item.symbol === symbol ? { ...item, quantity: Number(quantity) } : item
      )
    );
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 handleTestSubmit called');
    
    const selectedFromChecklist = getSelectedElementsFromChecklist();
    if (selectedFromChecklist.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one element from the checklist' });
      return;
    }
    try {
      setLoading(true);
      const testData = selectedFromChecklist.map(element => ({
        symbol: element.symbol,
        quantity: element.quantity
      }));
      
      console.log('🔍 Sending test data:', testData);
      console.log('🔍 API call to /device/sw-parameters');
      
      setLastSentData({
        timestamp: new Date().toISOString(),
        data: testData,
        requestBody: { elements: testData }
      });
      
      const response = await api.post('/device/sw-parameters', { 
        elements: testData,
        deviceId: deviceId
      });
      console.log('🔍 API response received:', response);
      
      setAlert({ type: 'success', message: 'Test parameters sent successfully!' });
      setElementChecklist(prev => prev.map(item => ({ ...item, checked: false })));
    } catch (error) {
      console.error('🔍 API call failed:', error);
      console.error('🔍 Error details:', error.response?.data, error.response?.status);
      setAlert({ type: 'error', message: 'Failed to send test parameters' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceSettingsEdit = async (rowIndex, columnId, value) => {
    const updatedSettings = { ...deviceSettings };
    const settingKey = Object.keys(updatedSettings).filter(key => key !== 'vout_table')[rowIndex];
    if (settingKey) {
      updatedSettings[settingKey] = value;
      setDeviceSettings(updatedSettings);
      try {
        await api.post('/device/settings', {
          ...updatedSettings,
          deviceId: deviceId
        });
        setAlert({ type: 'success', message: 'Device settings updated successfully!' });
      } catch (error) {
        setAlert({ type: 'error', message: 'Failed to update device settings' });
      }
    }
  };

  // Excel import/export functions for STP using utility functions
  const exportSTP = () => {
    try {
      // Prepare STP data with quantities from checklist
      const selectedFromChecklist = getSelectedElementsFromChecklist();
      
      if (selectedFromChecklist.length === 0) {
        setAlert({ type: 'error', message: 'Please select elements from the checklist to export' });
        return;
      }

      const stpData = selectedFromChecklist.map(element => ({
        symbol: element.symbol,
        name: element.name,
        quantity: element.quantity,
        vout_base: element.vout_base,
        freq: element.freq
      }));

      const result = exportComprehensiveData(deviceSettings, stpData, 'stp_and_device_settings.xlsx', {
        includeValidation: true,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setAlert({ type: 'success', message: 'STP and device settings exported successfully!' });
      } else {
        setAlert({ type: 'error', message: `Export failed: ${result.message}` });
      }
    } catch (error) {
      console.error('Export error:', error);
      setAlert({ type: 'error', message: 'Failed to export STP parameters' });
    }
  };

  const importSTP = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const result = await importComprehensiveData(file, {
        validateData: true,
        allowUnknownParameters: false
      });

      if (result.success) {
        // Update STP data in checklist
        if (result.stpData && result.stpData.length > 0) {
          const updatedChecklist = elementChecklist.map(checklistItem => {
            const importedData = result.stpData.find(row => row.symbol === checklistItem.symbol);
            if (importedData) {
              return {
                ...checklistItem,
                quantity: Number(importedData.quantity) || checklistItem.defaultQuantity,
                checked: true
              };
            }
            return checklistItem;
          });
          
          setElementChecklist(updatedChecklist);
        }

        // Update device settings
        if (result.deviceSettings && Object.keys(result.deviceSettings).length > 0) {
          setDeviceSettings(prev => ({ ...prev, ...result.deviceSettings }));
        }

        // Show validation warnings if any
        if (result.warnings && result.warnings.length > 0) {
          setAlert({ 
            type: 'warning', 
            message: `Import completed with warnings: ${result.warnings.join(', ')}` 
          });
        } else {
          setAlert({ type: 'success', message: 'STP and device settings imported successfully!' });
        }

        // Show validation summary if available
        if (result.validation) {
          console.log('Import validation:', result.validation);
        }
      } else {
        setAlert({ type: 'error', message: `Import failed: ${result.message}` });
      }
    } catch (error) {
      console.error('Import error:', error);
      setAlert({ type: 'error', message: 'Failed to import STP parameters. Please check the file format.' });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const downloadSTPTemplate = () => {
    try {
      const result = createComprehensiveTemplate('stp_and_device_template.xlsx', {
        includeInstructions: true,
        includeValidationRules: true
      });

      if (result.success) {
        setAlert({ type: 'success', message: 'STP and device settings template downloaded successfully!' });
      } else {
        setAlert({ type: 'error', message: `Template download failed: ${result.message}` });
      }
    } catch (error) {
      console.error('Template download error:', error);
      setAlert({ type: 'error', message: 'Failed to download template' });
    }
  };

  // Export only STP data (for sending to device)
  const exportSWPForDevice = () => {
    try {
      // Prepare STP data with quantities for device communication from checklist
      const selectedFromChecklist = getSelectedElementsFromChecklist();
      
      if (selectedFromChecklist.length === 0) {
        setAlert({ type: 'error', message: 'Please select elements from the checklist to export' });
        return;
      }

      const stpData = selectedFromChecklist.map(element => ({
        symbol: element.symbol,
        name: element.name,
        quantity: element.quantity,
        vout_base: element.vout_base,
        freq: element.freq
      }));

      const result = exportSTPForDevice(stpData, 'stp_for_device.xlsx');

      if (result.success) {
        setAlert({ type: 'success', message: 'STP data exported for device communication!' });
      } else {
        setAlert({ type: 'error', message: `Export failed: ${result.message}` });
      }
    } catch (error) {
      console.error('STP export error:', error);
      setAlert({ type: 'error', message: 'Failed to export STP data' });
    }
  };

  // Export the exact SWP data that gets sent to the controller
  const exportControllerSWP = () => {
    try {
      // Use last sent data if available, otherwise use current checklist selection
      let controllerData;
      let exportSource;
      
      if (lastSentData && lastSentData.data) {
        controllerData = lastSentData.data;
        exportSource = 'Last Sent Data';
      } else {
        const selectedFromChecklist = getSelectedElementsFromChecklist();
        if (selectedFromChecklist.length > 0) {
          controllerData = selectedFromChecklist.map(element => ({
            symbol: element.symbol,
            quantity: element.quantity
          }));
          exportSource = 'Current Checklist Selection';
        } else {
          setAlert({ type: 'error', message: 'No data available to export. Please send test parameters first or select elements from the checklist.' });
          return;
        }
      }

      // Create a workbook with the controller data
      const wb = XLSX.utils.book_new();
      
      // Controller SWP Data sheet (exact format sent to backend)
      const controllerWs = XLSX.utils.json_to_sheet(controllerData);
      XLSX.utils.book_append_sheet(wb, controllerWs, 'Controller SWP Data');
      
      // Add metadata sheet
      const metadata = [
        { Field: 'Export Date', Value: new Date().toISOString() },
        { Field: 'Export Source', Value: exportSource },
        { Field: 'Total Elements', Value: controllerData.length },
        { Field: 'Data Format', Value: 'Exact format sent to /api/device/sw-parameters' },
        { Field: 'API Endpoint', Value: '/api/device/sw-parameters' },
        { Field: 'Request Body', Value: JSON.stringify({ elements: controllerData }, null, 2) }
      ];
      
      // Add last sent timestamp if available
      if (lastSentData && lastSentData.timestamp) {
        metadata.push({ Field: 'Last Sent Timestamp', Value: lastSentData.timestamp });
      }
      const metadataWs = XLSX.utils.json_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, metadataWs, 'Export Metadata');
      
      // Download the file
      const filename = `controller_swp_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      setAlert({ type: 'success', message: `Controller SWP data exported as ${filename}` });
    } catch (error) {
      console.error('Controller SWP export error:', error);
      setAlert({ type: 'error', message: 'Failed to export controller SWP data' });
    }
  };

  // Available elements data with default quantities
  const ELEMENTS = useMemo(() => [
  { symbol: 'Li', name: 'Li', defaultQuantity: 100, vout_base: 3.71, freq: 2226 },
  { symbol: 'Ca', name: 'Ca', defaultQuantity: 100, vout_base: 2.95, freq: 1765 },
  { symbol: 'Na', name: 'Na', defaultQuantity: 100, vout_base: 3.032, freq: 1818 },
  { symbol: 'Cl', name: 'Cl', defaultQuantity: 100, vout_base: 3.916, freq: 2351 },
  { symbol: 'Fe', name: 'Fe', defaultQuantity: 100, vout_base: 4.558, freq: 2739 },
  { symbol: 'Zn', name: 'Zn', defaultQuantity: 100, vout_base: 4.167, freq: 2504 },
  { symbol: 'Cu', name: 'Cu', defaultQuantity: 100, vout_base: 4.557, freq: 2739 },
  { symbol: 'Pb', name: 'Pb', defaultQuantity: 100, vout_base: 3.321, freq: 1988 },
  { symbol: 'Mg', name: 'Mg', defaultQuantity: 100, vout_base: 3.63, freq: 2175 },
  { symbol: 'Mn', name: 'Mn', defaultQuantity: 100, vout_base: 4.497, freq: 2697 },
  { symbol: 'Cd', name: 'Cd', defaultQuantity: 100, vout_base: 3.711, freq: 2228 },
  { symbol: 'K', name: 'K', defaultQuantity: 100, vout_base: 2.454, freq: 1466 },
  { symbol: 'B', name: 'B', defaultQuantity: 100, vout_base: 5.256, freq: 3161 },
  { symbol: 'F', name: 'F', defaultQuantity: 100, vout_base: 3.896, freq: 2340 },
  { symbol: 'Mo', name: 'Mo', defaultQuantity: 100, vout_base: 4.147, freq: 2486 },
  { symbol: 'Ni', name: 'Ni', defaultQuantity: 100, vout_base: 4.661, freq: 2797 },
  { symbol: 'Se', name: 'Se', defaultQuantity: 100, vout_base: 3.423, freq: 2052 },
  { symbol: 'Si', name: 'Si', defaultQuantity: 100, vout_base: 3.814, freq: 2287 },
  { symbol: 'Ag', name: 'Ag', defaultQuantity: 100, vout_base: 4.043, freq: 2428 },
  { symbol: 'As', name: 'As', defaultQuantity: 100, vout_base: 3.711, freq: 2228 },
  { symbol: 'Hg', name: 'Hg', defaultQuantity: 100, vout_base: 3.568, freq: 2140 },
  { symbol: 'P', name: 'P', defaultQuantity: 100, vout_base: 3.402, freq: 2041 },
  { symbol: 'Al', name: 'Al', defaultQuantity: 100, vout_base: 4.065, freq: 2439 },
  { symbol: 'Cr', name: 'Cr', defaultQuantity: 100, vout_base: 1.343, freq: 797 },
  { symbol: 'Co', name: 'Co', defaultQuantity: 100, vout_base: 4.66, freq: 2797 },
  { symbol: 'Ba', name: 'Ba', defaultQuantity: 100, vout_base: 2.598, freq: 1554 },
  { symbol: 'Am', name: 'Am', defaultQuantity: 100, vout_base: 3.341, freq: 1999 },
  { symbol: 'NO', name: 'NO', defaultQuantity: 100, vout_base: 4.660, freq: 2797 }
  ], []);



  // Column definitions for Device Settings - non-editable for non-admin users
  const deviceSettingsColumns = [
    { id: 'setting', label: 'Setting', sortable: true, editable: false },
    { 
      id: 'value', 
      label: 'Value', 
      align: 'center', 
      sortable: true,
      editable: role === 'admin' || role === 'superadmin',
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
  ];



  // Fetch device settings
  const fetchDeviceSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/device/settings');
      setDeviceSettings(response.data);
    } catch (error) {
      console.error('Error fetching device settings:', error);
      // Set mock data for demonstration
      setDeviceSettings({
        device_id: 'DEV_001',
        firmware_version: '1.2.3',
        operating_mode: 'Normal',
        freefall: 10,
        hptf: 500,
        harmonic: 0,
        duration_ms: 7000,
        vout_table: [
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
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch current transport mode
  const fetchTransportMode = async () => {
    try {
      const response = await api.get('/device/transport-mode');
      setTransportMode(response.data.mode || 'auto');
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to fetch transport mode' });
    }
  };

  // Change transport mode
  const handleTransportModeChange = async (mode) => {
    setTransportLoading(true);
    if (mode === 'bluetooth') {
      try {
        const { characteristic } = await connectBluetooth();
        setBluetoothCharacteristic(characteristic);
        setBluetoothConnected(true);
        setTransportMode('bluetooth');
        setAlert({ type: 'success', message: 'Bluetooth connected!' });
      } catch (error) {
        setAlert({ type: 'error', message: 'Bluetooth connection failed' });
        setBluetoothConnected(false);
      }
      setTransportLoading(false);
      return;
    }
    try {
      const response = await api.post('/device/transport-mode', { mode });
      setTransportMode(response.data.mode);
      setAlert({ type: 'success', message: `Transport mode set to ${response.data.mode}` });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to set transport mode' });
    }
    setBluetoothConnected(false);
    setBluetoothCharacteristic(null);
    setTransportLoading(false);
  };

  useEffect(() => {
    fetchDeviceSettings();
    fetchTransportMode();
    
    const socket = getSocket();
    socket.on('device-settings-updated', (newSettings) => {
      setDeviceSettings(newSettings);
    });

    return () => {
      socket.off('device-settings-updated');
    };
  }, []);

  // Initialize element checklist with all elements
  useEffect(() => {
    const checklist = ELEMENTS.map(element => ({
      ...element,
      checked: false,
      quantity: element.defaultQuantity
    }));
    setElementChecklist(checklist);
  }, [ELEMENTS]);



  // Convert device settings to table data
  const deviceSettingsData = [
    { setting: 'Device ID', value: deviceSettings.device_id || 'N/A', unit: '' },
    { setting: 'Firmware Version', value: deviceSettings.firmware_version || 'N/A', unit: '' },
    { setting: 'Operating Mode', value: deviceSettings.operating_mode || 'N/A', unit: '' },
    { setting: 'Freefall', value: deviceSettings.freefall || 0, unit: 'ms' },
    { setting: 'HPTF', value: deviceSettings.hptf || 0, unit: 'Hz' },
    { setting: 'Harmonic', value: deviceSettings.harmonic || 0, unit: '' },
    { setting: 'Duration', value: deviceSettings.duration_ms || 0, unit: 'ms' }
  ];

  const isAdmin = role === 'admin' || role === 'superadmin';

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
        Device Control Dashboard
      </Typography>

      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Software Test Parameters (STP) - Editable by all users */}
        <Grid item xs={12} lg={8}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Software Test Parameters (STP)
                </Typography>
                <Chip 
                  label="Editable by all users" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              </Box>
              
              {/* Import/Export Buttons for STP */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ minWidth: 120 }}
                  >
                    Import STP
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={downloadSTPTemplate}
                    sx={{ minWidth: 120 }}
                  >
                    Download Template
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportSTP}
                    sx={{ minWidth: 120 }}
                  >
                    Export STP
                  </Button>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setHelpModalOpen(true)}
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
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={importSTP}
                style={{ display: 'none' }}
              />

            {/* Help Modal */}
            {helpModalOpen && (
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
                onClick={() => setHelpModalOpen(false)}
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
                      Element Selection & Excel Export Help
                    </Typography>
                    <Button
                      onClick={() => setHelpModalOpen(false)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      ✕
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    <strong>Checklist:</strong> Select elements using checkboxes and adjust quantities as needed
                    <br /><br />
                    <strong>Send Test Parameters:</strong> Only sends <strong>symbol</strong> and <strong>quantity</strong> to the controller
                    <br /><br />
                    <strong>Excel Export:</strong> Export selected elements with full data (symbol, name, quantity, vout_base, freq)
                    <br /><br />
                    <strong>Controller SWP:</strong> <strong>EXACT data sent to backend API</strong> - only symbol and quantity
                    <br /><br />
                    Use the template to see the expected format before importing.
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Element Checklist and Selected Elements Tables */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 3, width: '100%', minWidth: '1200px' }}>
                {/* Element Checklist Table - Left Side */}
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, flex: 1, minWidth: 0 }}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
                    <Typography variant="subtitle2">Available Elements</Typography>
                  </Box>
                  <Box sx={{ maxHeight: 500, overflow: 'auto', p: 2, overflowX: 'visible' }}>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '100px 3fr 180px 180px', 
                      gridTemplateRows: '1fr',
                      p: 3, 
                      bgcolor: 'grey.50', 
                      borderBottom: '1px solid #e0e0e0', 
                      fontWeight: 600,
                      height: '60px'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Select</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Element Symbol</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Default Qty</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Custom Qty</Box>
                    </Box>
                    {filteredElements.map((element, index) => (
                      <Box key={element.symbol} sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '100px 3fr 180px 180px', 
                        gridTemplateRows: '1fr',
                        p: 3, 
                        borderBottom: '1px solid #f0f0f0',
                        '&:hover': { bgcolor: 'grey.50' },
                        height: '60px'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={element.checked}
                            onChange={(e) => handleChecklistChange(element.symbol, e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center'
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                            {element.symbol}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {element.defaultQuantity}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="number"
                            value={element.quantity}
                            onChange={(e) => handleCustomQtyChange(element.symbol, parseInt(e.target.value) || 0)}
                            min="0"
                            max="100"
                            style={{
                              width: '120px',
                              height: '36px',
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px',
                              textAlign: 'center',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Selected Elements Table - Right Side */}
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, flex: 1, minWidth: 0 }}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
                    <Typography variant="subtitle2">Selected Elements</Typography>
                  </Box>
                  <Box sx={{ maxHeight: 500, overflow: 'auto', p: 2 }}>
                    {getSelectedElementsFromChecklist().length > 0 ? (
                      <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', p: 2, bgcolor: 'grey.50', borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
                          <Box>Element</Box>
                          <Box>Quantity</Box>
                        </Box>
                        {getSelectedElementsFromChecklist().map((element, index) => (
                          <Box key={element.symbol} sx={{ display: 'grid', gridTemplateColumns: '1fr 120px', p: 2, borderBottom: '1px solid #f0f0f0', '&:hover': { bgcolor: 'grey.50' } }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {element.symbol}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {element.name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {element.quantity}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                          No elements selected
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Select elements from the checklist to see them here
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleTestSubmit}
                disabled={getSelectedElementsFromChecklist().length === 0 || loading}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
                
              <Typography variant="body2" color="text.secondary">
                {getSelectedElementsFromChecklist().length} element(s) selected
              </Typography>
              
              {getSelectedElementsFromChecklist().length > 0 && (
                  <Button
                    variant="outlined"
                  onClick={() => setElementChecklist(prev => prev.map(item => ({ ...item, checked: false })))}
                    disabled={loading}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Device Settings - Non-editable for non-admin users */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Device Settings
                </Typography>
                {!isAdmin && (
                  <Chip 
                    label="Read-only" 
                    color="warning" 
                    size="small" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Box>
              {/* Transport Mode Toggle for Admins */}
              {isAdmin && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Transport Mode:
                  </Typography>
                  <ButtonGroup variant="outlined" color="primary" disabled={transportLoading}>
                    <Button
                      variant={transportMode === 'wifi' ? 'contained' : 'outlined'}
                      onClick={() => handleTransportModeChange('wifi')}
                      disabled={transportMode === 'wifi' || transportLoading}
                    >
                      WiFi
                    </Button>
                    <Button
                      variant={transportMode === 'uart' ? 'contained' : 'outlined'}
                      onClick={() => handleTransportModeChange('uart')}
                      disabled={transportMode === 'uart' || transportLoading}
                    >
                      UART
                    </Button>
                    <Button
                      variant={transportMode === 'bluetooth' ? 'contained' : 'outlined'}
                      onClick={() => handleTransportModeChange('bluetooth')}
                      disabled={transportMode === 'bluetooth' || transportLoading}
                    >
                      Bluetooth
                    </Button>
                    <Button
                      variant={transportMode === 'auto' ? 'contained' : 'outlined'}
                      onClick={() => handleTransportModeChange('auto')}
                      disabled={transportMode === 'auto' || transportLoading}
                    >
                      Auto
                    </Button>
                  </ButtonGroup>
                  <Chip
                    label={`Current: ${transportMode.toUpperCase()}`}
                    color={
                      transportMode === 'wifi' ? 'success' :
                      transportMode === 'uart' ? 'info' :
                      transportMode === 'bluetooth' ? 'primary' : 'default'
                    }
                    size="small"
                    sx={{ ml: 2 }}
                  />
                  {transportMode === 'bluetooth' && bluetoothConnected && (
                    <Chip label="Bluetooth Connected" color="primary" size="small" sx={{ ml: 2 }} />
                  )}
                </Box>
              )}
              {/* End Transport Mode Toggle */}
              <SortableTable
                columns={deviceSettingsColumns}
                data={deviceSettingsData}
                editable={isAdmin}
                onEdit={handleDeviceSettingsEdit}
                permissions={{
                  canEdit: isAdmin,
                  canDelete: false,
                  canAdd: false
                }}
                showActions={false}
              />
            </CardContent>
          </Card>
        </Grid>


      </Grid>
    </Box>
  );
};

export default DeviceControl;
