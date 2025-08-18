import * as XLSX from 'xlsx';

/**
 * Validate Excel file before processing
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateExcelFile = (file) => {
  const errors = [];
  const warnings = [];

  // Check file type
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    errors.push('File must be an Excel file (.xlsx or .xls)');
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('File size must be less than 10MB');
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Comprehensive Excel export function for both device settings and STP data
 * @param {Object} deviceSettings - Device configuration parameters
 * @param {Array} stpData - Software Test Parameters data
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportComprehensiveData = (deviceSettings, stpData, filename = 'aquatron_data.xlsx', options = {}) => {
  try {
    // Validate inputs
    if (!deviceSettings && !stpData) {
      throw new Error('No data provided for export');
    }

    const wb = XLSX.utils.book_new();
    
    // Device Settings sheet
    if (deviceSettings && Object.keys(deviceSettings).length > 0) {
      const deviceSettingsData = [
        { Parameter: 'Freefall', Value: deviceSettings.freefall || 0, Unit: 'ms', Description: 'Freefall time in milliseconds' },
        { Parameter: 'HPTF', Value: deviceSettings.hptf || 0, Unit: 'Hz', Description: 'High Power Test Frequency' },
        { Parameter: 'Harmonic', Value: deviceSettings.harmonic || 0, Unit: '', Description: 'Harmonic mode (0=FULL, 1=HALF, 2=QUARTER)' },
        { Parameter: 'Duration', Value: deviceSettings.duration_ms || 0, Unit: 'ms', Description: 'Test duration in milliseconds' }
      ];
      const deviceWs = XLSX.utils.json_to_sheet(deviceSettingsData);
      XLSX.utils.book_append_sheet(wb, deviceWs, 'Device Settings');
      
      // Vout Table sheet (if available)
      if (deviceSettings.vout_table && deviceSettings.vout_table.length > 0) {
        const voutWs = XLSX.utils.json_to_sheet(deviceSettings.vout_table);
        XLSX.utils.book_append_sheet(wb, voutWs, 'Vout Table');
      }
    }
    
    // STP Data sheet
    if (stpData && stpData.length > 0) {
      const stpWs = XLSX.utils.json_to_sheet(stpData);
      XLSX.utils.book_append_sheet(wb, stpWs, 'Software Test Parameters');
    }
    
    // Configuration Info sheet
    const configInfo = [
      { Field: 'Export Date', Value: new Date().toISOString(), Description: 'Date and time of export' },
      { Field: 'Device Settings Count', Value: deviceSettings ? Object.keys(deviceSettings).filter(k => k !== 'vout_table').length : 0, Description: 'Number of device settings exported' },
      { Field: 'Vout Table Entries', Value: deviceSettings?.vout_table?.length || 0, Description: 'Number of vout table entries' },
      { Field: 'STP Parameters', Value: stpData?.length || 0, Description: 'Number of software test parameters' },
      { Field: 'Format Version', Value: '1.1', Description: 'Excel format version' },
      { Field: 'Export Options', Value: JSON.stringify(options), Description: 'Export configuration options' }
    ];
    const configWs = XLSX.utils.json_to_sheet(configInfo);
    XLSX.utils.book_append_sheet(wb, configWs, 'Configuration Info');
    
    XLSX.writeFile(wb, filename);
    return { success: true, message: 'Data exported successfully', filename };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to export data', error: error.message };
  }
};

/**
 * Comprehensive Excel import function for both device settings and STP data
 * @param {File} file - Excel file to import
 * @param {Object} options - Import options
 * @returns {Object} Imported data structure
 */
export const importComprehensiveData = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    // Validate file first
    const fileValidation = validateExcelFile(file);
    if (!fileValidation.isValid) {
      reject({ 
        success: false, 
        message: 'File validation failed', 
        errors: fileValidation.errors 
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result = {
          deviceSettings: {},
          stpData: [],
          voutTable: [],
          success: true,
          message: 'Data imported successfully',
          warnings: [],
          importedSheets: [],
          totalRows: 0
        };
        
        // Read Device Settings sheet
        const deviceSheet = workbook.Sheets['Device Settings'];
        if (deviceSheet) {
          const deviceData = XLSX.utils.sheet_to_json(deviceSheet);
          result.totalRows += deviceData.length;
          deviceData.forEach(row => {
            if (row.Parameter && row.Value !== undefined) {
              const value = Number(row.Value);
              if (!isNaN(value)) {
                switch (row.Parameter) {
                  case 'Freefall':
                    result.deviceSettings.freefall = value;
                    break;
                  case 'HPTF':
                    result.deviceSettings.hptf = value;
                    break;
                  case 'Harmonic':
                    result.deviceSettings.harmonic = value;
                    break;
                  case 'Duration':
                    result.deviceSettings.duration_ms = value;
                    break;
                  default:
                    if (options.allowUnknownParameters) {
                      result.deviceSettings[row.Parameter] = value;
                    }
                    break;
                }
              } else {
                result.warnings.push(`Invalid value for ${row.Parameter}: ${row.Value}`);
              }
            }
          });
          result.importedSheets.push('Device Settings');
        }
        
        // Read Vout Table sheet
        const voutSheet = workbook.Sheets['Vout Table'];
        if (voutSheet) {
          result.voutTable = XLSX.utils.sheet_to_json(voutSheet);
          result.totalRows += result.voutTable.length;
          result.importedSheets.push('Vout Table');
        }
        
        // Read Software Test Parameters sheet
        const stpSheet = workbook.Sheets['Software Test Parameters'];
        if (stpSheet) {
          let rawStpData = XLSX.utils.sheet_to_json(stpSheet);
          // Combine duplicates by symbol or name
          const combined = {};
          rawStpData.forEach(item => {
            // Use symbol if present, else name
            const key = (item.symbol || item.name || '').toString().trim();
            if (!key) return;
            if (!combined[key]) {
              combined[key] = { ...item };
              if (typeof combined[key].quantity !== 'number') combined[key].quantity = Number(combined[key].quantity) || 0;
            } else {
              // Sum quantities
              const qty = Number(item.quantity) || 0;
              combined[key].quantity += qty;
            }
          });
          result.stpData = Object.values(combined);
          result.totalRows += result.stpData.length;
          result.importedSheets.push('Software Test Parameters');
        }
        
        // Validate imported data
        if (Object.keys(result.deviceSettings).length === 0 && 
            result.voutTable.length === 0 && 
            result.stpData.length === 0) {
          result.success = false;
          result.message = 'No valid data found in the Excel file';
        }
        
        // Apply validation rules if specified
        if (options.validateData) {
          const validationResult = validateImportedData(result);
          result.validation = validationResult;
          if (!validationResult.isValid) {
            result.warnings.push(...validationResult.errors);
          }
        }
        
        resolve(result);
      } catch (error) {
        console.error('Import error:', error);
        reject({ 
          success: false, 
          message: 'Failed to import data', 
          error: error.message 
        });
      }
    };
    
    reader.onerror = () => {
      reject({ 
        success: false, 
        message: 'Failed to read file' 
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate imported data according to business rules
 * @param {Object} data - Imported data object
 * @returns {Object} Validation result
 */
export const validateImportedData = (data) => {
  const errors = [];
  const warnings = [];
  
  // Validate device settings
  if (data.deviceSettings) {
    if (data.deviceSettings.freefall !== undefined && (data.deviceSettings.freefall < 0 || data.deviceSettings.freefall > 1000)) {
      errors.push('Freefall value must be between 0 and 1000 ms');
    }
    if (data.deviceSettings.hptf !== undefined && (data.deviceSettings.hptf < 0 || data.deviceSettings.hptf > 10000)) {
      errors.push('HPTF value must be between 0 and 10000 Hz');
    }
    if (data.deviceSettings.harmonic !== undefined && ![0, 1, 2].includes(data.deviceSettings.harmonic)) {
      errors.push('Harmonic value must be 0, 1, or 2');
    }
    if (data.deviceSettings.duration_ms !== undefined && (data.deviceSettings.duration_ms < 1000 || data.deviceSettings.duration_ms > 60000)) {
      errors.push('Duration must be between 1000 and 60000 ms');
    }
  }
  
  // Validate STP data
  if (data.stpData && data.stpData.length > 0) {
    data.stpData.forEach((item, index) => {
      if (!(item.symbol || item.name)) {
        errors.push(`Row ${index + 1}: Missing symbol or name`);
      }
      // Quantity limit removed
      if (item.vout_base !== undefined && (item.vout_base < 0 || item.vout_base > 10)) {
        errors.push(`Row ${index + 1}: Vout base must be between 0 and 10V`);
      }
      if (item.freq !== undefined && (item.freq < 1 || item.freq > 10000)) {
        errors.push(`Row ${index + 1}: Frequency must be between 1 and 10000 Hz`);
      }
    });
  }
  
  // Validate Vout table
  if (data.voutTable && data.voutTable.length > 0) {
    data.voutTable.forEach((item, index) => {
      if (!item.symbol) {
        errors.push(`Vout Table Row ${index + 1}: Missing symbol`);
      }
      if (item.vout_base !== undefined && (item.vout_base < 0 || item.vout_base > 10)) {
        errors.push(`Vout Table Row ${index + 1}: Vout base must be between 0 and 10V`);
      }
      if (item.freq !== undefined && (item.freq < 1 || item.freq > 10000)) {
        errors.push(`Vout Table Row ${index + 1}: Frequency must be between 1 and 10000 Hz`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      deviceSettingsValid: Object.keys(data.deviceSettings || {}).length > 0,
      stpDataValid: (data.stpData || []).length > 0,
      voutTableValid: (data.voutTable || []).length > 0
    }
  };
};

/**
 * Create a comprehensive template Excel file
 * @param {string} filename - Template filename
 * @param {Object} options - Template options
 */
export const createComprehensiveTemplate = (filename = 'aquatron_template.xlsx', options = {}) => {
  try {
    const wb = XLSX.utils.book_new();
    // Only one sheet: Software Test Parameters with columns: symbol (name) and quantity
    const stpTemplate = [
      { symbol: 'Li', quantity: 100 },
      { symbol: 'Ca', quantity: 100 },
      { symbol: 'Na', quantity: 100 },
      { symbol: 'Cl', quantity: 100 },
      { symbol: 'Fe', quantity: 100 },
      { symbol: 'Zn', quantity: 100 },
      { symbol: 'Cu', quantity: 100 },
      { symbol: 'Pb', quantity: 100 },
      { symbol: 'Mg', quantity: 100 },
      { symbol: 'Mn', quantity: 100 },
      { symbol: 'Cd', quantity: 100 },
      { symbol: 'K', quantity: 100 },
      { symbol: 'B', quantity: 100 },
      { symbol: 'F', quantity: 100 },
      { symbol: 'Mo', quantity: 100 },
      { symbol: 'Ni', quantity: 100 },
      { symbol: 'Se', quantity: 100 },
      { symbol: 'Si', quantity: 100 },
      { symbol: 'Ag', quantity: 100 },
      { symbol: 'As', quantity: 100 },
      { symbol: 'Hg', quantity: 100 },
      { symbol: 'P', quantity: 100 },
      { symbol: 'Al', quantity: 100 },
      { symbol: 'Cr', quantity: 100 },
      { symbol: 'Co', quantity: 100 },
      { symbol: 'Ba', quantity: 100 },
      { symbol: 'Am', quantity: 100 },
      { symbol: 'NO', quantity: 100 }
    ];
    const stpWs = XLSX.utils.json_to_sheet(stpTemplate);
    XLSX.utils.book_append_sheet(wb, stpWs, 'Software Test Parameters');
    XLSX.writeFile(wb, filename);
    return { success: true, message: 'Template created successfully', filename };
  } catch (error) {
    console.error('Template creation error:', error);
    return { success: false, message: 'Failed to create template', error: error.message };
  }
};

/**
 * Export only STP data for device communication
 * @param {Array} stpData - Software Test Parameters data
 * @param {string} filename - Output filename
 */
export const exportSTPForDevice = (stpData, filename = 'stp_for_device.xlsx') => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Create STP data in the exact format needed for device communication
    const deviceStpData = stpData.map(item => ({
      symbol: item.symbol,
      quantity: item.quantity || 100,
      vout_base: item.vout_base,
      freq: item.freq
    }));
    
    const stpWs = XLSX.utils.json_to_sheet(deviceStpData);
    XLSX.utils.book_append_sheet(wb, stpWs, 'STP for Device');
    
    XLSX.writeFile(wb, filename);
    return { success: true, message: 'STP data exported for device communication', filename };
  } catch (error) {
    console.error('STP export error:', error);
    return { success: false, message: 'Failed to export STP data', error: error.message };
  }
};

/**
 * Export only device settings
 * @param {Object} deviceSettings - Device configuration parameters
 * @param {string} filename - Output filename
 */
export const exportDeviceSettingsOnly = (deviceSettings, filename = 'device_settings.xlsx') => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Basic device settings sheet
    const basicSettings = [
      { Parameter: 'Freefall', Value: deviceSettings.freefall || 0, Unit: 'ms' },
      { Parameter: 'HPTF', Value: deviceSettings.hptf || 0, Unit: 'Hz' },
      { Parameter: 'Harmonic', Value: deviceSettings.harmonic || 0, Unit: '' },
      { Parameter: 'Duration', Value: deviceSettings.duration_ms || 0, Unit: 'ms' }
    ];
    const basicWs = XLSX.utils.json_to_sheet(basicSettings);
    XLSX.utils.book_append_sheet(wb, basicWs, 'Basic Settings');
    
    // Vout table sheet (if available)
    if (deviceSettings.vout_table && deviceSettings.vout_table.length > 0) {
      const voutWs = XLSX.utils.json_to_sheet(deviceSettings.vout_table);
      XLSX.utils.book_append_sheet(wb, voutWs, 'Vout Table');
    }
    
    XLSX.writeFile(wb, filename);
    return { success: true, message: 'Device settings exported successfully', filename };
  } catch (error) {
    console.error('Device settings export error:', error);
    return { success: false, message: 'Failed to export device settings', error: error.message };
  }
};

/**
 * Import only device settings from Excel file
 * @param {File} file - Excel file to import
 * @returns {Object} Imported device settings
 */
export const importDeviceSettingsOnly = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result = {
          deviceSettings: {},
          voutTable: [],
          success: true,
          message: 'Device settings imported successfully'
        };
        
        // Read Basic Settings sheet
        const basicSheet = workbook.Sheets['Basic Settings'];
        if (basicSheet) {
          const basicData = XLSX.utils.sheet_to_json(basicSheet);
          basicData.forEach(row => {
            if (row.Parameter && row.Value !== undefined) {
              const value = Number(row.Value);
              if (!isNaN(value)) {
                switch (row.Parameter) {
                  case 'Freefall':
                    result.deviceSettings.freefall = value;
                    break;
                  case 'HPTF':
                    result.deviceSettings.hptf = value;
                    break;
                  case 'Harmonic':
                    result.deviceSettings.harmonic = value;
                    break;
                  case 'Duration':
                    result.deviceSettings.duration_ms = value;
                    break;
                  default:
                    break;
                }
              }
            }
          });
        }
        
        // Read Vout Table sheet
        const voutSheet = workbook.Sheets['Vout Table'];
        if (voutSheet) {
          result.voutTable = XLSX.utils.sheet_to_json(voutSheet);
        }
        
        resolve(result);
      } catch (error) {
        console.error('Import error:', error);
        reject({ 
          success: false, 
          message: 'Failed to import device settings', 
          error: error.message 
        });
      }
    };
    
    reader.onerror = () => {
      reject({ 
        success: false, 
        message: 'Failed to read file' 
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Import only STP data from Excel file
 * @param {File} file - Excel file to import
 * @returns {Object} Imported STP data
 */
export const importSTPOnly = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result = {
          stpData: [],
          success: true,
          message: 'STP data imported successfully'
        };
        
        // Read Software Test Parameters sheet
        const stpSheet = workbook.Sheets['Software Test Parameters'];
        if (stpSheet) {
          result.stpData = XLSX.utils.sheet_to_json(stpSheet);
        }
        
        if (result.stpData.length === 0) {
          result.success = false;
          result.message = 'No STP data found in the Excel file';
        }
        
        resolve(result);
      } catch (error) {
        console.error('Import error:', error);
        reject({ 
          success: false, 
          message: 'Failed to import STP data', 
          error: error.message 
        });
      }
    };
    
    reader.onerror = () => {
      reject({ 
        success: false, 
        message: 'Failed to read file' 
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Transform data for different export formats
 * @param {Object} data - Data to transform
 * @param {string} format - Target format ('csv', 'json', 'xml')
 * @returns {Object} Transformed data
 */
export const transformDataForExport = (data, format = 'excel') => {
  try {
    switch (format.toLowerCase()) {
      case 'csv':
        return transformToCSV(data);
      case 'json':
        return transformToJSON(data);
      case 'xml':
        return transformToXML(data);
      default:
        return data;
    }
  } catch (error) {
    console.error('Data transformation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Transform data to CSV format
 * @param {Object} data - Data to transform
 * @returns {Object} CSV data
 */
const transformToCSV = (data) => {
  const csvData = {};
  
  if (data.deviceSettings) {
    const deviceCSV = Object.entries(data.deviceSettings)
      .filter(([key]) => key !== 'vout_table')
      .map(([key, value]) => `${key},${value}`)
      .join('\n');
    csvData.deviceSettings = `Parameter,Value\n${csvData.deviceSettings}`;
  }
  
  if (data.stpData) {
    const stpCSV = data.stpData.map(row => 
      Object.values(row).join(',')
    ).join('\n');
    csvData.stpData = `${Object.keys(data.stpData[0] || {}).join(',')}\n${stpCSV}`;
  }
  
  return { success: true, data: csvData, format: 'csv' };
};

/**
 * Transform data to JSON format
 * @param {Object} data - Data to transform
 * @returns {Object} JSON data
 */
const transformToJSON = (data) => {
  return { 
    success: true, 
    data: JSON.stringify(data, null, 2), 
    format: 'json' 
  };
};

/**
 * Transform data to XML format
 * @param {Object} data - Data to transform
 * @returns {Object} XML data
 */
const transformToXML = (data) => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<AquatronData>\n';
  
  if (data.deviceSettings) {
    xml += '  <DeviceSettings>\n';
    Object.entries(data.deviceSettings)
      .filter(([key]) => key !== 'vout_table')
      .forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
      });
    xml += '  </DeviceSettings>\n';
  }
  
  if (data.stpData) {
    xml += '  <STPData>\n';
    data.stpData.forEach(item => {
      xml += '    <Element>\n';
      Object.entries(item).forEach(([key, value]) => {
        xml += `      <${key}>${value}</${key}>\n`;
      });
      xml += '    </Element>\n';
    });
    xml += '  </STPData>\n';
  }
  
  xml += '</AquatronData>';
  return { success: true, data: xml, format: 'xml' };
};

/**
 * Create a backup of current data
 * @param {Object} data - Data to backup
 * @param {string} filename - Backup filename
 * @returns {Object} Backup result
 */
export const createDataBackup = (data, filename = `aquatron_backup_${new Date().toISOString().split('T')[0]}.xlsx`) => {
  try {
    const backupData = {
      deviceSettings: data.deviceSettings || {},
      stpData: data.stpData || [],
      voutTable: data.voutTable || [],
      backupInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        description: 'Automatic backup of Aquatron data'
      }
    };
    
    const result = exportComprehensiveData(
      backupData.deviceSettings, 
      backupData.stpData, 
      filename,
      { isBackup: true, timestamp: backupData.backupInfo.timestamp }
    );
    
    return result;
  } catch (error) {
    console.error('Backup creation error:', error);
    return { success: false, message: 'Failed to create backup', error: error.message };
  }
};

/**
 * Restore data from backup
 * @param {File} backupFile - Backup file to restore from
 * @returns {Object} Restore result
 */
export const restoreFromBackup = async (backupFile) => {
  try {
    const result = await importComprehensiveData(backupFile, {
      validateData: true,
      allowUnknownParameters: true,
      isRestore: true
    });
    
    if (result.success) {
      // Validate backup integrity
      if (!result.backupInfo) {
        result.warnings.push('Backup file may not be a valid backup (missing backup info)');
      }
      
      return result;
    } else {
      return result;
    }
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, message: 'Failed to restore from backup', error: error.message };
  }
};

/**
 * Compare two datasets and highlight differences
 * @param {Object} originalData - Original data
 * @param {Object} newData - New data to compare
 * @returns {Object} Comparison result
 */
export const compareDataSets = (originalData, newData) => {
  const differences = {
    deviceSettings: {},
    stpData: [],
    voutTable: [],
    summary: {
      totalChanges: 0,
      deviceSettingsChanges: 0,
      stpDataChanges: 0,
      voutTableChanges: 0
    }
  };
  
  try {
    // Compare device settings
    if (originalData.deviceSettings && newData.deviceSettings) {
      Object.keys(originalData.deviceSettings).forEach(key => {
        if (key !== 'vout_table' && originalData.deviceSettings[key] !== newData.deviceSettings[key]) {
          differences.deviceSettings[key] = {
            original: originalData.deviceSettings[key],
            new: newData.deviceSettings[key]
          };
          differences.summary.deviceSettingsChanges++;
          differences.summary.totalChanges++;
        }
      });
    }
    
    // Compare STP data
    if (originalData.stpData && newData.stpData) {
      const originalMap = new Map(originalData.stpData.map(item => [item.symbol, item]));
      const newMap = new Map(newData.stpData.map(item => [item.symbol, item]));
      
      // Find added, removed, and modified items
      newData.stpData.forEach(newItem => {
        const originalItem = originalMap.get(newItem.symbol);
        if (!originalItem) {
          differences.stpData.push({ type: 'added', item: newItem });
          differences.summary.stpDataChanges++;
          differences.summary.totalChanges++;
        } else if (JSON.stringify(originalItem) !== JSON.stringify(newItem)) {
          differences.stpData.push({ 
            type: 'modified', 
            symbol: newItem.symbol,
            original: originalItem,
            new: newItem 
          });
          differences.summary.stpDataChanges++;
          differences.summary.totalChanges++;
        }
      });
      
      originalData.stpData.forEach(originalItem => {
        if (!newMap.has(originalItem.symbol)) {
          differences.stpData.push({ type: 'removed', item: originalItem });
          differences.summary.stpDataChanges++;
          differences.summary.totalChanges++;
        }
      });
    }
    
    return { success: true, differences };
  } catch (error) {
    console.error('Data comparison error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export data summary report
 * @param {Object} data - Data to summarize
 * @param {string} filename - Output filename
 * @returns {Object} Export result
 */
export const exportDataSummary = (data, filename = 'aquatron_summary.xlsx') => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      { Metric: 'Total Device Settings', Value: Object.keys(data.deviceSettings || {}).filter(k => k !== 'vout_table').length },
      { Metric: 'Total STP Parameters', Value: (data.stpData || []).length },
      { Metric: 'Total Vout Table Entries', Value: (data.voutTable || []).length },
      { Metric: 'Export Date', Value: new Date().toISOString() },
      { Metric: 'Data Version', Value: '1.0' }
    ];
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Statistics sheet
    if (data.stpData && data.stpData.length > 0) {
      const statsData = [
        { Statistic: 'Average Quantity', Value: data.stpData.reduce((sum, item) => sum + (item.quantity || 0), 0) / data.stpData.length },
        { Statistic: 'Average Vout Base', Value: data.stpData.reduce((sum, item) => sum + (item.vout_base || 0), 0) / data.stpData.length },
        { Statistic: 'Average Frequency', Value: data.stpData.reduce((sum, item) => sum + (item.freq || 0), 0) / data.stpData.length },
        { Statistic: 'Min Quantity', Value: Math.min(...data.stpData.map(item => item.quantity || 0)) },
        { Statistic: 'Max Quantity', Value: Math.max(...data.stpData.map(item => item.quantity || 0)) }
      ];
      
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
    }
    
    XLSX.writeFile(wb, filename);
    return { success: true, message: 'Data summary exported successfully', filename };
  } catch (error) {
    console.error('Summary export error:', error);
    return { success: false, message: 'Failed to export data summary', error: error.message };
  }
};
