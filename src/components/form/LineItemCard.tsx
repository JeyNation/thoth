import React from 'react';
import { Box, IconButton, Paper, Stack, Typography, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { makeLineItemField } from '../../types/fieldIds';
import { LINE_ITEM_COLUMNS, humanizeColumnKey, type LineItemColumnKey } from '../../types/lineItemColumns';
import type { LineItem } from '../../types/PurchaseOrder';
import RowDropZone from './RowDropZone';
import LineItemField from './LineItemField';

export interface LineItemCardProps {
  item: LineItem;
  isRowDropActive: boolean;
  externallyActive?: boolean;
  onRowDragOver: (e: React.DragEvent) => void;
  onRowDragLeave: (e: React.DragEvent) => void;
  onRowDrop: (e: React.DragEvent) => void;
  onInsertRelative: (before: boolean) => void;
  onRemove: () => void;
  getTextFieldSx: (fieldId: string) => Record<string, any>;
  activeColumnDrop: { lineNumber: number; field: LineItemColumnKey } | null;
  setActiveColumnDrop: React.Dispatch<React.SetStateAction<{ lineNumber: number; field: LineItemColumnKey } | null>>;
  onFieldFocus: (fieldId: string) => void;
  onFieldBlur: () => void;
  handleLineItemChange: (lineNumber: number, field: string, value: string | number, kind: string, opts?: { explicitClear?: boolean }) => void;
  clearLineItemField: (lineNumber: number, field: string, kind: string) => void;
  handleLineItemDrop: (e: React.DragEvent, lineNumber: number, field: string, kind: 'text' | 'textarea' | 'integer' | 'decimal') => void;
}

const LineItemCard: React.FC<LineItemCardProps> = ({
  item,
  isRowDropActive,
  externallyActive = false,
  onRowDragOver,
  onRowDragLeave,
  onRowDrop,
  onInsertRelative,
  onRemove,
  getTextFieldSx,
  activeColumnDrop,
  setActiveColumnDrop,
  onFieldFocus,
  onFieldBlur,
  handleLineItemChange,
  clearLineItemField,
  handleLineItemDrop,
}) => {
  const renderField = (field: 'sku' | 'description' | 'quantity' | 'unitPrice') => {
    const fieldId = makeLineItemField(item.lineNumber, field);
    const kind: 'text' | 'textarea' | 'integer' | 'decimal' =
      field === 'description' ? 'textarea' : field === 'quantity' ? 'integer' : field === 'unitPrice' ? 'decimal' : 'text';
    const value = item[field];
    const isDropActive = !!(activeColumnDrop && activeColumnDrop.lineNumber === item.lineNumber && activeColumnDrop.field === field);
    const baseSx = getTextFieldSx(fieldId);
    const aria = `${humanizeColumnKey(field)} for line ${item.lineNumber}`;

    return (
      <LineItemField
        key={fieldId}
        fieldId={fieldId}
        lineNumber={item.lineNumber}
        field={field}
        kind={kind}
        value={value}
        baseSx={baseSx}
  isDropActive={isDropActive}
  isGlobalDragActive={externallyActive}
        ariaLabel={aria}
        onChange={(val, opts) => handleLineItemChange(item.lineNumber, field, val, kind, opts)}
        onClear={() => clearLineItemField(item.lineNumber, field, kind)}
        onFocus={() => onFieldFocus(fieldId)}
        onBlur={() => onFieldBlur()}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/json')) {
            e.preventDefault();
            if (!isDropActive) setActiveColumnDrop({ lineNumber: item.lineNumber, field });
          }
        }}
        onDragLeave={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && (e.currentTarget as HTMLElement).contains(next)) return;
          setActiveColumnDrop((prev) => (prev && prev.lineNumber === item.lineNumber && prev.field === field ? null : prev));
        }}
        onDrop={(e) => {
          setActiveColumnDrop(null);
          handleLineItemDrop(e, item.lineNumber, field, kind);
        }}
      />
    );
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
      <Stack direction="row" spacing={0} alignItems="flex-start">
        <RowDropZone
          lineNumber={item.lineNumber}
          isActive={isRowDropActive}
          externallyActive={externallyActive}
          onDragOver={onRowDragOver}
          onDragLeave={onRowDragLeave}
          onDrop={onRowDrop}
        />
        <Stack spacing={0} useFlexGap sx={{ flex: 1, minWidth: 0, position: 'relative', p: 2 }}>
          <Stack direction="row" spacing={0} alignItems="flex-start" justifyContent="space-between">
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, paddingTop: '4px' }}>
              ${ (item.quantity * item.unitPrice).toFixed(2) }
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Tooltip title={`Add line (hold Ctrl to insert above)`}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(event) => onInsertRelative(!!event.ctrlKey)}
                  sx={{ width: 32, height: 32 }}
                  aria-label={`Insert line after ${item.lineNumber}`}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={`Remove line ${item.lineNumber}`}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={onRemove}
                  sx={{ width: 32, height: 32 }}
                  aria-label={`Remove line ${item.lineNumber}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack spacing={1.5}>
            {LINE_ITEM_COLUMNS.map((col) => (
              <Box key={`${item.lineNumber}-${col}`}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {humanizeColumnKey(col)}
                </Typography>
                {renderField(col)}
              </Box>
            ))}
          </Stack>
          <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, borderRight: '1px solid', borderColor: 'divider' }} />
        </Stack>
      </Stack>
    </Paper>
  );
};

export default React.memo(LineItemCard);
