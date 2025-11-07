import type { SxProps, StackProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

export const LINE_ITEM_PAPER_SX: SxProps<Theme> = {
  borderRadius: 2,
  borderColor: 'divider',
};

export const LINE_ITEM_STACK_SX: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  position: 'relative',
  p: 2,
};

// Layout/prop groups for Stack components to centralize layout decisions
export const LINE_ITEM_OUTER_STACK_PROPS: StackProps = {
  direction: 'row',
  spacing: 0,
  alignItems: 'flex-start',
};

export const LINE_ITEM_INNER_STACK_PROPS: StackProps = {
  spacing: 0,
  useFlexGap: true,
  sx: LINE_ITEM_STACK_SX,
};

export const LINE_ITEM_HEADER_STACK_PROPS: StackProps = {
  direction: 'row',
  spacing: 0,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  mb: 1.5,
};

export const LINE_ITEM_ACTIONS_STACK_PROPS: StackProps = {
  direction: 'row',
  spacing: 0.5,
  alignItems: 'flex-start',
};

export const LINE_ITEM_FIELDS_STACK_PROPS: StackProps = {
  spacing: 1.5,
};

export const LINE_ITEM_TOTAL_SX: SxProps<Theme> = {
  fontWeight: 600,
  lineHeight: 1.2,
  pt: '4px',
};

export const LINE_ITEM_ICON_BUTTON_SX: SxProps<Theme> = {
  width: 32,
  height: 32,
};

export const LINE_ITEM_CAPTION_SX: SxProps<Theme> = {
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

export const LINE_ITEM_DIVIDER_SX: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  borderRight: '1px solid',
  borderColor: 'divider',
};

const lineItemCardStyles = {
  LINE_ITEM_PAPER_SX,
  LINE_ITEM_STACK_SX,
  LINE_ITEM_TOTAL_SX,
  LINE_ITEM_ICON_BUTTON_SX,
  LINE_ITEM_CAPTION_SX,
  LINE_ITEM_DIVIDER_SX,
};

export default lineItemCardStyles;
