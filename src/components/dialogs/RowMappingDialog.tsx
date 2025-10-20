'use client';

import React, { useMemo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { humanizeColumnKey } from '../../types/lineItemColumns';
import type { MultiFieldPair } from '../../types/mapping';
import type { LineItemColumnKey } from '../../types/lineItemColumns';

export interface RowMappingDialogProps {
  column: LineItemColumnKey;
  pairs: MultiFieldPair[];
  proposedRows: Record<string, number | null>;
  onChange: (updates: Record<string, number | null>) => void;
  onApply: () => void;
  onCancel: () => void;
}

const RowMappingDialog: React.FC<RowMappingDialogProps> = ({ column, pairs, proposedRows, onChange, onApply, onCancel }) => {
  const rowOptions = useMemo(() => {
    // Build a continuous range starting from 1 up to the largest of:
    // - the highest proposed row
    // - the number of pairs
    // - a reasonable minimum (5)
    const assigned = Object.values(proposedRows).filter((v): v is number => typeof v === 'number');
    const maxAssigned = assigned.length ? Math.max(...assigned) : 0;
    const maxFromPairs = pairs.length || 0;
    const maxRow = Math.max(5, maxAssigned, maxFromPairs);
    return Array.from({ length: maxRow }, (_, idx) => idx + 1);
  }, [pairs.length, proposedRows]);

  const handleRowChange = (fieldId: string) => (event: SelectChangeEvent) => {
    const value = event.target.value;
    onChange({ ...proposedRows, [fieldId]: value === '' ? null : parseInt(value, 10) });
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      fullWidth
      maxWidth="md"
      aria-labelledby={`row-mapping-title-${column}`}
    >
      <DialogTitle id={`row-mapping-title-${column}`} sx={{ pb: 1 }}>
        Assign Rows For {humanizeColumnKey(column)}
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Review predicted row assignments. Adjust before applying.
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Row mapping table">
            <TableHead>
              <TableRow>
                <TableCell width="40%">Source Text</TableCell>
                <TableCell width="20%">Row</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairs.map((pair) => (
                <TableRow key={pair.boxId} hover>
                  <TableCell title={pair.text} sx={{ maxWidth: 240 }}>
                    <Typography variant="body2" noWrap>{pair.text}</Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`row-select-${pair.fieldId}`}>Row</InputLabel>
                      <Select
                        labelId={`row-select-${pair.fieldId}`}
                        label="Row"
                        value={proposedRows[pair.fieldId] == null ? '' : String(proposedRows[pair.fieldId])}
                        onChange={handleRowChange(pair.fieldId)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {rowOptions.map((row) => (
                          <MenuItem key={row} value={row}>
                            Row {row}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} color="inherit" variant="outlined">
          Cancel
        </Button>
        <Button onClick={onApply} variant="contained">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RowMappingDialog;
