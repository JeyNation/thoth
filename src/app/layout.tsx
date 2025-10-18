import type { Metadata } from 'next';
import '../styles/globals.css';
import ThemeRegistry from '../components/ThemeRegistry';
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';

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
            <AppBar position="static" color="primary" elevation={1}>
              <Toolbar>
                <Typography component="h1" variant="h6" sx={{ fontWeight: 600 }}>
                  Purchase Order Management System
                </Typography>
              </Toolbar>
            </AppBar>
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