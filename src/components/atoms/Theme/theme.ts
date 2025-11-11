import { createTheme } from '@mui/material/styles';

// Centralized theme tokens for the design system. Keep small for now.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
  },
});

export default theme;

// Field state tokens used by the design system primitives and by global CSS.
export const fieldStateTokens = {
  dropActiveBg: 'rgba(227, 242, 253, 0.82)',
  dropActiveBorder: 'rgba(25, 118, 210, 0.65)',
  fieldFocusedBorder: 'rgba(25, 118, 210, 0.65)',
  fieldLinkedBg: 'rgba(76, 175, 80, 0.10)',
  fieldLinkedBorder: 'rgb(76, 175, 80)',
};

export type FieldStateTokens = typeof fieldStateTokens;
