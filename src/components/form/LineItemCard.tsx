import React from 'react';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Paper, Stack, Typography } from '@mui/material';

import FieldInput from './FieldInput';
import RowDropZone from './RowDropZone';
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
import { makeLineItemField } from '../../types/fieldIds';
import {
  LINE_ITEM_COLUMNS,
  humanizeColumnKey,
  type LineItemColumnKey,
} from '../../types/lineItemColumns';
import type { LineItem } from '../../types/PurchaseOrder';
import { IconButton } from '../ui/Button/IconButton';
import { SubsectionLabel } from '../ARCHIVED_common/SubsectionLabel';

export interface LineItemCardProps {
  item: LineItem;
  externallyActive?: boolean;
  onRowDrop: (e: React.DragEvent) => void;
  onInsertRelative: (before: boolean) => void;
  onRemove: () => void;
  getTextFieldSx: (fieldId: string) => Record<string, unknown>;
  activeColumnDrop: { lineNumber: number; field: LineItemColumnKey } | null;
  setActiveColumnDrop: React.Dispatch<
    React.SetStateAction<{ lineNumber: number; field: LineItemColumnKey } | null>
  >;
  onFieldFocus: (fieldId: string) => void;
  onFieldBlur: () => void;
  linkedFieldIdSet: Set<string>;
  handleLineItemChange: (
    lineNumber: number,
    field: string,
    value: string | number,
    kind: string,
    opts?: { explicitClear?: boolean },
  ) => void;
  clearLineItemField: (lineNumber: number, field: string, kind: string) => void;
  handleLineItemDrop: (
    e: React.DragEvent,
    lineNumber: number,
    field: string,
    kind: 'text' | 'textarea' | 'integer' | 'decimal',
  ) => void;
}

const LineItemCard: React.FC<LineItemCardProps> = ({
  item,
  externallyActive = false,
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
  linkedFieldIdSet,
}) => {
  const renderField = (field: 'sku' | 'description' | 'quantity' | 'unitPrice') => {
    const fieldId = makeLineItemField(item.lineNumber, field);
    const kind: 'text' | 'textarea' | 'integer' | 'decimal' =
      field === 'description'
        ? 'textarea'
        : field === 'quantity'
        ? 'integer'
        : field === 'unitPrice'
        ? 'decimal'
        : 'text';
    const value = item[field];
    const isDropActive = !!(
      activeColumnDrop &&
      activeColumnDrop.lineNumber === item.lineNumber &&
      activeColumnDrop.field === field
    );
    // baseSx removed — styling now handled via semantic classes
    const aria = `${humanizeColumnKey(field)} for line ${item.lineNumber}`;

    const isLinked = linkedFieldIdSet.has(fieldId);

    return (
      <FieldInput
        id={fieldId}
        kind={kind}
        value={value}
        isDragActive={isDropActive || externallyActive}
        isLinked={isLinked}
        ariaLabel={aria}
        label={humanizeColumnKey(field)}
        onChange={(val, opts) => handleLineItemChange(item.lineNumber, field, val, kind, opts)}
        onClear={() => clearLineItemField(item.lineNumber, field, kind)}
        onFocus={() => onFieldFocus(fieldId)}
        onBlur={() => onFieldBlur()}
        onDragOver={e => {
          if (e.dataTransfer.types.includes('application/json')) {
            e.preventDefault();
            if (!isDropActive) setActiveColumnDrop({ lineNumber: item.lineNumber, field });
          }
        }}
        onDragLeave={e => {
          const next = e.relatedTarget as Node | null;
          if (next && (e.currentTarget as HTMLElement).contains(next)) return;
          setActiveColumnDrop(prev =>
            prev && prev.lineNumber === item.lineNumber && prev.field === field ? null : prev,
          );
        }}
        onDrop={e => {
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
          externallyActive={externallyActive}
          onDrop={onRowDrop}
        />
        <Stack {...LINE_ITEM_INNER_STACK_PROPS}>
          <Stack {...LINE_ITEM_HEADER_STACK_PROPS}>
            <Typography variant="body2" sx={LINE_ITEM_TOTAL_SX}>
              ${(item.quantity * item.unitPrice).toFixed(2)}
            </Typography>
            <Stack {...LINE_ITEM_ACTIONS_STACK_PROPS}>
              <IconButton
                ariaLabel="Add line (hold Ctrl to insert above)"
                size="small"
                color="primary"
                onClick={(event: React.MouseEvent) => onInsertRelative(!!event.ctrlKey)}
              >
                <AddIcon />
              </IconButton>
              <IconButton
                ariaLabel={`Remove line ${item.lineNumber}`}
                size="small"
                color="error"
                onClick={onRemove}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Stack {...LINE_ITEM_FIELDS_STACK_PROPS}>
            {LINE_ITEM_COLUMNS.map(col => (
              <Box key={`${item.lineNumber}-${col}`}>{renderField(col)}</Box>
            ))}
          </Stack>
          <Box sx={LINE_ITEM_DIVIDER_SX} />
        </Stack>
      </Stack>
    </Paper>
  );
};

export default React.memo(LineItemCard);
