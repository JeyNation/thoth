// Shared drop highlight styling tokens and helpers

export const DROP_ACTIVE_BG = 'rgba(227,242,253,0.82)';
export const DROP_ACTIVE_BORDER = 'rgba(25,118,210,0.65)';
export const DROP_ACTIVE_INSET = 'inset 0 0 0 1px rgba(25,118,210,0.35)';
export const DROP_BORDER_RADIUS_PX = 12;

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
      backgroundColor: DROP_ACTIVE_BG,
      boxShadow: DROP_ACTIVE_INSET,
      transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
      '& fieldset': {
        ...fieldset,
        borderWidth: 1,
        borderColor: DROP_ACTIVE_BORDER,
      },
      '&:hover fieldset': {
        ...hoverFieldset,
        borderColor: DROP_ACTIVE_BORDER,
      },
      '&.Mui-focused fieldset': {
        ...focusedFieldset,
        borderColor: DROP_ACTIVE_BORDER,
        boxShadow: DROP_ACTIVE_INSET,
      },
    },
  };
};
