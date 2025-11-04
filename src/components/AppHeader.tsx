import { AppBar, Toolbar, Typography } from '@mui/material';

export const AppHeader = () => {
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography component="h1" variant="h6" sx={{ fontWeight: 600 }}>
          Purchase Order Management System
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
