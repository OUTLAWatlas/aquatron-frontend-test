import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  FormControlLabel,
  Switch
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  ArrowUpward, 
  ArrowDownward, 
  Sort, 
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: 0,
    width: '100%',
    minWidth: 600,
  },
  '& .MuiTableHead-root .MuiTableRow-root': {
    backgroundColor: theme.palette.primary.main,
    '& .MuiTableCell-root': {
      color: theme.palette.primary.contrastText,
      fontWeight: 600,
      fontSize: '0.875rem',
      padding: '16px 12px',
      borderBottom: 'none',
      '&:first-of-type': {
        borderTopLeftRadius: theme.shape.borderRadius,
      },
      '&:last-of-type': {
        borderTopRightRadius: theme.shape.borderRadius,
      },
    },
  },
  '& .MuiTableBody-root .MuiTableRow-root': {
    '&:nth-of-type(even)': {
      backgroundColor: theme.palette.grey[50],
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '& .MuiTableCell-root': {
      padding: '12px 16px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      fontSize: '0.875rem',
      verticalAlign: 'middle',
    },
  },
  '& .MuiTableSortLabel-root': {
    color: theme.palette.primary.contrastText,
    '&:hover': {
      color: theme.palette.primary.light,
    },
    '&.Mui-active': {
      color: theme.palette.primary.light,
    },
  },
  '& .editable-cell': {
    position: 'relative',
    '&:hover .edit-button': {
      opacity: 1,
    },
  },
  '& .edit-button': {
    opacity: 0,
    transition: 'opacity 0.2s',
    position: 'absolute',
    right: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
}));

const SortableTable = ({ 
  columns, 
  data, 
  title, 
  defaultSort = null,
  defaultOrder = 'asc',
  onRowClick = null,
  showIndex = false,
  editable = false,
  onEdit = null,
  onDelete = null,
  onAdd = null,
  addDialog = null,
  showActions = true,
  showPagination = true,
  defaultRowsPerPage = 5,
  permissions = {
    canEdit: true,
    canDelete: true,
    canAdd: true
  }
}) => {
  const { role } = useAuth();
  const [order, setOrder] = useState(defaultOrder);
  const [orderBy, setOrderBy] = useState(defaultSort);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);


  
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Handle nested object properties
      if (orderBy.includes('.')) {
        const keys = orderBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number') {
        // Keep as is for numbers
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (order === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }, [data, orderBy, order]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!showPagination || !sortedData) return sortedData || [];
    const startIndex = page * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, page, rowsPerPage, showPagination]);

  const totalPages = Math.ceil((sortedData || []).length / rowsPerPage);

  // Validate props AFTER ALL hooks
  if (!columns || !Array.isArray(columns)) {
    console.error('SortableTable: columns prop is missing or not an array:', columns);
    return <Box>Error: Invalid columns prop</Box>;
  }
  
  if (!data || !Array.isArray(data)) {
    console.error('SortableTable: data prop is missing or not an array:', data);
    return <Box>Error: Invalid data prop</Box>;
  }
  
  if (data.length === 0) {
    console.log('SortableTable: data array is empty');
    return <Box>No data available</Box>;
  }

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getSortIcon = (columnId) => {
    if (orderBy !== columnId) {
      return <Sort />;
    }
    return order === 'desc' ? <ArrowDownward /> : <ArrowUpward />;
  };

  const handleEditStart = (rowIndex, columnId, value) => {
    setEditingCell({ rowIndex, columnId });
    setEditValue(value);
  };

  const handleEditSave = () => {
    if (onEdit && editingCell) {
      onEdit(editingCell.rowIndex, editingCell.columnId, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleDelete = (rowIndex) => {
    if (onDelete) {
      onDelete(rowIndex);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page when changing rows per page
  };

  const canEdit = editable && permissions.canEdit && (role === 'admin' || role === 'superadmin');
  const canDelete = editable && permissions.canDelete && (role === 'admin' || role === 'superadmin');
  const canAdd = editable && permissions.canAdd && (role === 'admin' || role === 'superadmin');



  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
          {canAdd && onAdd && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              size="small"
            >
              Add New
            </Button>
          )}
        </Box>
      )}
      <StyledTableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              {showIndex && (
                <TableCell align="center" sx={{ width: 60 }}>
                  #
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{ 
                    width: column.width,
                    cursor: column.sortable !== false ? 'pointer' : 'default'
                  }}
                  onClick={() => column.sortable !== false && handleRequestSort(column.id)}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      IconComponent={() => getSortIcon(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {editable && (canDelete) && showActions && (
                <TableCell align="center" sx={{ width: 120 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              const actualIndex = page * rowsPerPage + index;
              
              return (
                <TableRow
                  key={actualIndex}
                  hover
                  onClick={() => onRowClick && onRowClick(row, actualIndex)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {showIndex && (
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {actualIndex + 1}
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const isEditing = editingCell && 
                      editingCell.rowIndex === actualIndex && 
                      editingCell.columnId === column.id;
                    
                    return (
                      <TableCell 
                        key={column.id} 
                        align={column.align || 'left'}
                        className={column.editable ? 'editable-cell' : ''}
                        sx={{ position: 'relative' }}
                      >
                        {isEditing ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {column.type === 'select' ? (
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  autoFocus
                                >
                                  {column.options?.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                size="small"
                                autoFocus
                                type={column.type || 'text'}
                                inputProps={column.inputProps}
                              />
                            )}
                            <IconButton size="small" onClick={handleEditSave} color="primary">
                              <SaveIcon />
                            </IconButton>
                            <IconButton size="small" onClick={handleEditCancel} color="error">
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>
                              {column.render ? column.render(row[column.id], row, actualIndex) : row[column.id]}
                            </span>
                            {column.editable && canEdit && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStart(actualIndex, column.id, row[column.id]);
                                  }}
                                  className="edit-button"
                                  sx={{ ml: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                  {editable && (canDelete) && showActions && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {canDelete && (
                          <Tooltip title="Delete Row">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(actualIndex);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </StyledTableContainer>

                                                       {/* Pagination Controls */}
         {showPagination && data.length > 0 && (
           <Box sx={{ 
             display: 'flex', 
             justifyContent: 'space-between', 
             alignItems: 'center', 
             mt: 2, 
             px: 2, 
             py: 1,
             backgroundColor: 'background.paper',
             borderTop: '1px solid',
             borderColor: 'divider'
           }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Typography variant="body2" color="text.secondary">
                 Rows per page:
               </Typography>
               <FormControl size="small" sx={{ minWidth: 80 }}>
                 <Select
                   value={rowsPerPage}
                   onChange={handleRowsPerPageChange}
                   displayEmpty
                   sx={{ height: 32 }}
                 >
                   <MenuItem value={5}>5</MenuItem>
                   <MenuItem value={10}>10</MenuItem>
                   <MenuItem value={25}>25</MenuItem>
                   <MenuItem value={50}>50</MenuItem>
                 </Select>
               </FormControl>
               <Typography variant="body2" color="text.secondary">
                 {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, sortedData.length)} of ${sortedData.length}`}
               </Typography>
             </Box>
             <Pagination
               count={totalPages}
               page={page + 1}
               onChange={handlePageChange}
               showFirstButton
               showLastButton
               size="small"
               sx={{
                 '& .MuiPaginationItem-root': {
                   fontSize: '0.875rem',
                 }
               }}
             />
           </Box>
         )}

      {/* Add Dialog */}
      {addDialog && (
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Entry</DialogTitle>
          <DialogContent>
            {addDialog}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (onAdd) onAdd();
              setAddDialogOpen(false);
            }} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SortableTable;
