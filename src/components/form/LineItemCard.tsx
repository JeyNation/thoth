import React from 'react';
import { Box, IconButton, Paper, Stack, Typography, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { makeLineItemField } from '../../types/fieldIds';
import { LINE_ITEM_COLUMNS, humanizeColumnKey, type LineItemColumnKey } from '../../types/lineItemColumns';
import type { LineItem } from '../../types/PurchaseOrder';
import RowDropZone from './RowDropZone';
import FieldInput from './FieldInput';
import {
  LINE_ITEM_PAPER_SX,
  LINE_ITEM_STACK_SX,
  LINE_ITEM_TOTAL_SX,
  LINE_ITEM_ICON_BUTTON_SX,
  LINE_ITEM_CAPTION_SX,
  LINE_ITEM_DIVIDER_SX,
  LINE_ITEM_OUTER_STACK_PROPS,
  LINE_ITEM_INNER_STACK_PROPS,
  LINE_ITEM_HEADER_STACK_PROPS,
  LINE_ITEM_ACTIONS_STACK_PROPS,
  LINE_ITEM_FIELDS_STACK_PROPS,
} from '../../styles/lineItemCardStyles';

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
      <FieldInput
        id={fieldId}
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
    <Paper variant="outlined" sx={LINE_ITEM_PAPER_SX}>
      <Stack {...LINE_ITEM_OUTER_STACK_PROPS}>
        <RowDropZone
          lineNumber={item.lineNumber}
          isActive={isRowDropActive}
          externallyActive={externallyActive}
          onDragOver={onRowDragOver}
          onDragLeave={onRowDragLeave}
          onDrop={onRowDrop}
        />
        <Stack {...LINE_ITEM_INNER_STACK_PROPS}>
          <Stack {...LINE_ITEM_HEADER_STACK_PROPS}>
            <Typography variant="body2" sx={LINE_ITEM_TOTAL_SX}>
              ${ (item.quantity * item.unitPrice).toFixed(2) }
            </Typography>
            <Stack {...LINE_ITEM_ACTIONS_STACK_PROPS}>
              <Tooltip title={`Add line (hold Ctrl to insert above)`}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(event) => onInsertRelative(!!event.ctrlKey)}
                  sx={LINE_ITEM_ICON_BUTTON_SX}
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
                  sx={LINE_ITEM_ICON_BUTTON_SX}
                  aria-label={`Remove line ${item.lineNumber}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack {...LINE_ITEM_FIELDS_STACK_PROPS}>
            {LINE_ITEM_COLUMNS.map((col) => (
              <Box key={`${item.lineNumber}-${col}`}>
                <Typography variant="caption" color="text.secondary" sx={LINE_ITEM_CAPTION_SX}>
                  {humanizeColumnKey(col)}
                </Typography>
                {renderField(col)}
              </Box>
            ))}
          </Stack>
          <Box sx={LINE_ITEM_DIVIDER_SX} />
        </Stack>
      </Stack>
    </Paper>
  );
};

export default React.memo(LineItemCard);
