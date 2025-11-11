'use client';

import React, { useEffect } from 'react';

import { ThemeProvider, CssBaseline } from '@mui/material';

import { theme, fieldStateTokens } from './theme';

type Props = {
  children?: React.ReactNode;
};

function toCssVarName(key: string) {
  // map camelCase token keys to kebab-case CSS variable suffixes
  return `--thoth-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

export default function ThemeRegistry({ children }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    const applied: string[] = [];
    try {
      (Object.entries(fieldStateTokens) as [string, string][]).forEach(([k, v]) => {
        const name = toCssVarName(k);
        root.style.setProperty(name, v);
        applied.push(name);
      });
    } catch (err) {
      // swallow: defensive in case document isn't available (shouldn't happen client-side)
      // eslint-disable-next-line no-console
      console.warn('Failed to apply theme CSS variables', err);
    }

    return () => {
      applied.forEach(n => root.style.removeProperty(n));
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
