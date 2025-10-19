import React from 'react';
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
import { LINE_ITEM_COLUMNS, humanizeColumnKey, type LineItemColumnKey } from '../../types/lineItemColumns';
import type { MultiFieldPair } from '../../types/mapping';

export interface ColumnMappingDialogProps {
  lineNumber: number;
  pairs: MultiFieldPair[];
  proposed: Record<string, LineItemColumnKey | ''>;
  onChange: (updates: Record<string, LineItemColumnKey | ''>) => void;
  onApply: () => void;
  onCancel: () => void;
}

const ColumnMappingDialog: React.FC<ColumnMappingDialogProps> = ({ lineNumber, pairs, proposed, onChange, onApply, onCancel }) => {
  const handleSelectChange = (fieldId: string) => (event: SelectChangeEvent) => {
    const value = event.target.value as '' | LineItemColumnKey;
    onChange({ ...proposed, [fieldId]: value });
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      fullWidth
      maxWidth="md"
      aria-labelledby={`column-mapping-title-${lineNumber}`}
    >
      <DialogTitle id={`column-mapping-title-${lineNumber}`} sx={{ pb: 1 }}>
        Map Fields To Columns (Row {lineNumber})
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Review predicted column assignments. Adjust before applying.
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Column mapping table">
            <TableHead>
              <TableRow>
                <TableCell width="35%">Source Text</TableCell>
                <TableCell width="30%">Column</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairs.map((pair) => (
                <TableRow key={pair.boxId} hover>
                  <TableCell title={pair.text} sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap>{pair.text}</Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`column-select-${pair.fieldId}`}>Column</InputLabel>
                      <Select
                        labelId={`column-select-${pair.fieldId}`}
                        value={proposed[pair.fieldId] ?? ''}
                        label="Column"
                        onChange={handleSelectChange(pair.fieldId)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {LINE_ITEM_COLUMNS.map((col) => (
                          <MenuItem key={col} value={col}>
                            {humanizeColumnKey(col)}
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

export default ColumnMappingDialog;