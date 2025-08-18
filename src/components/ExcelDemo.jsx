import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper
} from '@mui/material';
import {
  DownloadIcon,
  UploadIcon,
  BackupIcon,
  RestoreIcon,
  CompareIcon,
  SummaryIcon,
  CheckCircleIcon,
  ErrorIcon,
  InfoIcon
} from '@mui/icons-material';
import {
  exportComprehensiveData,
  importComprehensiveData,
  createComprehensiveTemplate,
  exportSTPForDevice,
  createDataBackup,
  restoreFromBackup,
  compareDataSets,
  exportDataSummary,
  validateExcelFile
} from '../utils/excelUtils';

const ExcelDemo = () => {
  const [message, setMessage] = useState({ type: 'info', text: 'Welcome to Excel Import/Export Demo' });
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState({
    deviceSettings: {
      freefall: 15,
      hptf: 750,
      harmonic: 1,
      duration_ms: 8000,
      vout_table: [
        { symbol: 'H', vout_base: 1.0, freq: 600 },
        { symbol: 'Li', vout_base: 3.71, freq: 2226 },
        { symbol: 'Fe', vout_base: 4.558, freq: 2739 }
      ]
    },
    stpData: [
      { symbol: 'Li', name: 'Lithium', quantity: 50, vout_base: 3.71, freq: 2226 },
      { symbol: 'Fe', name: 'Iron', quantity: 75, vout_base: 4.558, freq: 2739 },
      { symbol: 'Cu', name: 'Copper', quantity: 100, vout_base: 3.7, freq: 2220 }
    ]
  });

  const fileInputRefs = {
    import: useRef(null),
    backup: useRef(null),
    comparison: useRef(null)
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: 'info', text: 'Ready for next operation' }), 5000);
  };

  const handleExport = async (type) => {
    try {
      setLoading(true);
      let result;

      switch (type) {
        case 'comprehensive':
          result = exportComprehensiveData(
            demoData.deviceSettings,
            demoData.stpData,
            'aquatron_comprehensive_demo.xlsx'
          );
          break;
        case 'stp':
          result = exportSTPForDevice(
            demoData.stpData,
            'stp_demo.xlsx'
          );
          break;
        case 'summary':
          result = exportDataSummary(
            demoData,
            'aquatron_summary_demo.xlsx'
          );
          break;
        default:
          throw new Error('Unknown export type');
      }

      if (result.success) {
        showMessage('success', `${type} export completed successfully!`);
      } else {
        showMessage('error', `Export failed: ${result.message}`);
      }
    } catch (error) {
      showMessage('error', `Export error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Validate file first
      const validation = validateExcelFile(file);
      if (!validation.isValid) {
        showMessage('error', `File validation failed: ${validation.errors.join(', ')}`);
        event.target.value = '';
        return;
      }

      const result = await importComprehensiveData(file, {
        validateData: true,
        allowUnknownParameters: true
      });

      if (result.success) {
        // Update demo data with imported data
        if (result.deviceSettings && Object.keys(result.deviceSettings).length > 0) {
          setDemoData(prev => ({
            ...prev,
            deviceSettings: { ...prev.deviceSettings, ...result.deviceSettings }
          }));
        }

        if (result.voutTable && result.voutTable.length > 0) {
          setDemoData(prev => ({
            ...prev,
            deviceSettings: {
              ...prev.deviceSettings,
              vout_table: result.voutTable
            }
          }));
        }

        if (result.stpData && result.stpData.length > 0) {
          setDemoData(prev => ({
            ...prev,
            stpData: result.stpData
          }));
        }

        showMessage('success', `Import successful! Imported ${result.totalRows} rows from ${result.importedSheets.join(', ')}`);
        
        if (result.warnings && result.warnings.length > 0) {
          showMessage('warning', `Import completed with warnings: ${result.warnings.join(', ')}`);
        }
      } else {
        showMessage('error', `Import failed: ${result.message}`);
      }

      event.target.value = '';
    } catch (error) {
      showMessage('error', `Import error: ${error.message}`);
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = () => {
    try {
      const result = createDataBackup(demoData, 'aquatron_demo_backup.xlsx');
      
      if (result.success) {
        showMessage('success', 'Backup created successfully!');
      } else {
        showMessage('error', `Backup failed: ${result.message}`);
      }
    } catch (error) {
      showMessage('error', `Backup error: ${error.message}`);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const result = await restoreFromBackup(file);
      
      if (result.success) {
        // Update demo data
        if (result.deviceSettings) {
          setDemoData(prev => ({
            ...prev,
            deviceSettings: { ...prev.deviceSettings, ...result.deviceSettings }
          }));
        }

        if (result.voutTable) {
          setDemoData(prev => ({
            ...prev,
            deviceSettings: {
              ...prev.deviceSettings,
              vout_table: result.voutTable
            }
          }));
        }

        if (result.stpData) {
          setDemoData(prev => ({
            ...prev,
            stpData: result.stpData
          }));
        }

        showMessage('success', 'Backup restored successfully!');
      } else {
        showMessage('error', `Restore failed: ${result.message}`);
      }

      event.target.value = '';
    } catch (error) {
      showMessage('error', `Restore error: ${error.message}`);
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const result = await importComprehensiveData(file, {
        validateData: true,
        allowUnknownParameters: true
      });

      if (result.success) {
        const comparison = compareDataSets(demoData, result);
        
        if (comparison.success) {
          const { differences } = comparison;
          const { summary } = differences;
          
          if (summary.totalChanges === 0) {
            showMessage('success', 'No differences found between current data and imported file.');
          } else {
            showMessage('info', `Found ${summary.totalChanges} differences: ${summary.deviceSettingsChanges} device settings, ${summary.stpDataChanges} STP parameters, ${summary.voutTableChanges} vout table entries.`);
            
            // Log detailed differences
            console.log('Data differences:', differences);
          }
        } else {
          showMessage('error', 'Failed to compare datasets');
        }
      } else {
        showMessage('error', 'Failed to read file for comparison');
      }

      event.target.value = '';
    } catch (error) {
      showMessage('error', `Comparison error: ${error.message}`);
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    try {
      const result = createComprehensiveTemplate('aquatron_demo_template.xlsx');
      
      if (result.success) {
        showMessage('success', 'Template downloaded successfully!');
      } else {
        showMessage('error', `Template download failed: ${result.message}`);
      }
    } catch (error) {
      showMessage('error', `Template download error: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Excel Import/Export Demo
      </Typography>
      
      <Alert severity={message.type} sx={{ mb: 3 }}>
        {message.text}
      </Alert>

      <Grid container spacing={3}>
        {/* Export Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Functions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('comprehensive')}
                  disabled={loading}
                  fullWidth
                >
                  Export Comprehensive Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('stp')}
                  disabled={loading}
                  fullWidth
                >
                  Export STP Data Only
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SummaryIcon />}
                  onClick={() => handleExport('summary')}
                  disabled={loading}
                  fullWidth
                >
                  Export Summary Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  disabled={loading}
                  fullWidth
                >
                  Download Template
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Import Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Functions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRefs.import.current?.click()}
                  disabled={loading}
                  fullWidth
                >
                  Import Excel File
                </Button>
                <input
                  ref={fileInputRefs.import}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup & Restore Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup & Restore
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={handleBackup}
                  disabled={loading}
                  fullWidth
                >
                  Create Backup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestoreIcon />}
                  onClick={() => fileInputRefs.backup.current?.click()}
                  disabled={loading}
                  fullWidth
                >
                  Restore from Backup
                </Button>
                <input
                  ref={fileInputRefs.backup}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleRestore}
                  style={{ display: 'none' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Comparison Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Comparison
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CompareIcon />}
                  onClick={() => fileInputRefs.comparison.current?.click()}
                  disabled={loading}
                  fullWidth
                >
                  Compare with File
                </Button>
                <input
                  ref={fileInputRefs.comparison}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleComparison}
                  style={{ display: 'none' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Data Display */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Demo Data
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Device Settings
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Freefall" 
                          secondary={`${demoData.deviceSettings.freefall} ms`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="HPTF" 
                          secondary={`${demoData.deviceSettings.hptf} Hz`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Harmonic" 
                          secondary={demoData.deviceSettings.harmonic} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Duration" 
                          secondary={`${demoData.deviceSettings.duration_ms} ms`} 
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    STP Parameters
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <List dense>
                      {demoData.stpData.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                          <ListItemText 
                            primary={item.name} 
                            secondary={`${item.symbol} - Qty: ${item.quantity}, Vout: ${item.vout_base}V, Freq: ${item.freq}Hz`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                <strong>Features demonstrated:</strong> Comprehensive Excel export/import, STP data handling, 
                device settings management, backup/restore functionality, data comparison, summary reports, 
                template generation, and file validation.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExcelDemo;
