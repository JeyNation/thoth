import { Box, Container } from '@mui/material';
import type { Metadata } from 'next';

import '../styles/globals.css';
import { AppHeader } from '../components/AppHeader';
import ThemeRegistry from '../components/ThemeRegistry';

export const metadata: Metadata = {
  title: 'Purchase Order Management System',
  description: 'Document extraction and purchase order management tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <ThemeRegistry>
          <Box component="div" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />
            <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Container maxWidth={false} disableGutters sx={{ flex: 1, minHeight: 0, display: 'flex', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                  {children}
                </Box>
              </Container>
            </Box>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}