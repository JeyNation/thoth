import { useState } from 'react';
import { Box, IconButton, Tooltip, Menu, MenuItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

interface WorkspaceMenuProps {
  onBackToDocuments: () => void;
}

export const WorkspaceMenu = ({ onBackToDocuments }: WorkspaceMenuProps) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleBackToDocuments = () => {
    handleMenuClose();
    onBackToDocuments();
  };

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
      <Tooltip title="Menu">
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleBackToDocuments}>
          <ListItemText>Back to Documents</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
