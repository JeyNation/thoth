import { Tabs, Tab } from '@mui/material';

interface WorkspaceTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export const WorkspaceTabs = ({ value, onChange }: WorkspaceTabsProps) => {
  return (
    <Tabs 
      value={value} 
      onChange={onChange}
      sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        minHeight: 48,
        '& .MuiTab-root': {
          minHeight: 48,
          '&:focus': {
            outline: 'none',
          },
          '&.Mui-focusVisible': {
            backgroundColor: 'transparent',
          },
        }
      }}
    >
      <Tab label="Form" disableRipple />
      <Tab label="Rules" disableRipple />
    </Tabs>
  );
};
