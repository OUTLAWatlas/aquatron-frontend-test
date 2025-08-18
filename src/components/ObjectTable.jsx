import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';


// Renders an object or array as a table, recursively
const ObjectTable = ({ data }) => {
  if (!data) return <span>No data</span>;

  // If array of objects (e.g. elements, vout_table)
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const headers = Object.keys(data[0]);
    return (
      <TableContainer component={Paper} sx={{ maxWidth: 500, mb: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headers.map((key) => (
                <TableCell key={key}>{key}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {headers.map((key) => (
                  <TableCell key={key}>
                    {typeof row[key] === 'object' && row[key] !== null
                      ? <ObjectTable data={row[key]} />
                      : row[key]?.toString() ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // If plain object
  if (typeof data === 'object' && !Array.isArray(data)) {
    return (
      <TableContainer component={Paper} sx={{ maxWidth: 500, mb: 1 }}>
        <Table size="small">
          <TableBody>
            {Object.entries(data).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>
                  {typeof value === 'object' && value !== null
                    ? <ObjectTable data={value} />
                    : value?.toString() ?? ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Fallback for primitives
  return <span>{data.toString()}</span>;
};

export default ObjectTable;
