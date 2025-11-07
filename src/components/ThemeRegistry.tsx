'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import * as React from 'react';

import theme from '../theme';

interface ThemeRegistryProps {
  children: React.ReactNode;
}

const ThemeRegistry: React.FC<ThemeRegistryProps> = ({ children }) => (
  <AppRouterCacheProvider options={{ key: 'mui' }}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </AppRouterCacheProvider>
);

export default ThemeRegistry;
