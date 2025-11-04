import React from 'react';
import { Box, Typography } from '@mui/material';

interface RuleTextProps {
    lines: string[];
}

export const RuleText: React.FC<RuleTextProps> = ({ lines }) => {
    return (
        <Box sx={{ flex: 1 }}>
            {lines.map((line: string, lineIndex: number) => (
                <Typography 
                    key={lineIndex} 
                    variant="body2" 
                    sx={{ 
                        mb: lineIndex < lines.length - 1 ? 0.5 : 0,
                        '&::before': lineIndex > 0 ? {
                            content: '"→ "',
                            color: 'primary.main',
                            fontWeight: 600,
                            mr: 0.5
                        } : undefined
                    }}
                >
                    {line}
                </Typography>
            ))}
        </Box>
    );
};
