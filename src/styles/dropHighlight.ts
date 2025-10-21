// Shared drop highlight styling tokens and helpers

export const DROP_ACTIVE_BG = 'rgba(227,242,253,0.82)';
export const DROP_ACTIVE_BORDER = 'rgba(25,118,210,0.65)';
export const DROP_ACTIVE_INSET = 'inset 0 0 0 1px rgba(25,118,210,0.35)';
export const DROP_BORDER_RADIUS_PX = 12;

// Shared style for dropzone active state — border-only dashed style (no background)
export const DROP_ZONE_ACTIVE_STYLE: Record<string, any> = {
  borderWidth: '2px',
  borderStyle: 'dashed',
  borderColor: DROP_ACTIVE_BORDER,
  transition: 'border-color 0.2s ease',
};

// Helper to apply a drop-highlight look to MUI OutlinedInput sx
export const applyDropHighlightSx = (base: Record<string, any>): Record<string, any> => {
  const root = { ...(base['& .MuiOutlinedInput-root'] ?? {}) };
  const fieldset = { ...(root['& fieldset'] ?? {}) };
  const hoverFieldset = { ...(root['&:hover fieldset'] ?? {}) };
  const focusedFieldset = { ...(root['&.Mui-focused fieldset'] ?? {}) };

  return {
    ...base,
    '& .MuiOutlinedInput-root': {
      ...root,
      transition: 'border-color 0.2s ease',
      '& fieldset': {
        ...fieldset,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: DROP_ACTIVE_BORDER,
      },
      '&:hover fieldset': {
        ...hoverFieldset,
        borderStyle: 'dashed',
        borderColor: DROP_ACTIVE_BORDER,
      },
      '&.Mui-focused fieldset': {
        ...focusedFieldset,
        borderStyle: 'dashed',
        borderColor: DROP_ACTIVE_BORDER,
      },
    },
  };
};
