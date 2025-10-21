import type { SxProps, Theme } from '@mui/material';

export const HIGHLIGHT_BG = 'rgba(76,175,80,0.15)';
export const HIGHLIGHT_BORDER = '#4caf50';
export const HIGHLIGHT_FOCUS_SHADOW = '0 0 0 2px rgba(46,125,50,0.25)';
export const FOCUS_SHADOW = '0 0 0 2px rgba(25,118,210,0.18)';
export const HIGHLIGHT_STRONG_BG = 'rgba(255,235,59,0.55)';
export const HIGHLIGHT_STRONG_SHADOW = '0 0 0 1px rgba(255,193,7,0.8)';
export const TRANSITION_BASE = 'box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease';

export function getTextFieldSxFor(highlight: boolean, stage?: 'strong' | 'fade' | 'normal'): SxProps<Theme> {
  const root: any = {
    borderRadius: 1.5,
    backgroundColor: highlight ? HIGHLIGHT_BG : 'background.paper',
    transition: TRANSITION_BASE,
    '& fieldset': {
      borderWidth: highlight ? 2 : 1,
      borderColor: highlight ? HIGHLIGHT_BORDER : 'divider',
    },
    '&:hover fieldset': {
      borderColor: highlight ? '#2e7d32' : 'primary.main',
    },
    '&.Mui-focused fieldset': {
      borderColor: highlight ? '#2e7d32' : 'primary.main',
      boxShadow: highlight ? HIGHLIGHT_FOCUS_SHADOW : FOCUS_SHADOW,
    },
  };

  if (stage === 'strong') {
    root.transition = 'background-color 1s ease, box-shadow 1s ease, border-color 1s ease';
    root.backgroundColor = HIGHLIGHT_STRONG_BG;
    root.boxShadow = HIGHLIGHT_STRONG_SHADOW;
    root['& fieldset'] = {
      ...(root['& fieldset'] || {}),
      borderColor: 'rgba(255,193,7,0.85)',
      borderWidth: 1,
    };
  } else if (stage === 'fade') {
    root.transition = 'background-color 1s ease, box-shadow 1s ease, border-color 1s ease';
    root['& fieldset'] = {
      ...(root['& fieldset'] || {}),
      transition: 'border-color 1s ease',
    };
  }

  return {
    '& .MuiOutlinedInput-root': root,
    '& input[type="number"]': {
      appearance: 'textfield',
      MozAppearance: 'textfield',
    },
    '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  };
}

export default { getTextFieldSxFor };
