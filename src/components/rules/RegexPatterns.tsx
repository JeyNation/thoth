import React from 'react';
import { Paper, Stack, Typography, IconButton, TextField, Button, Chip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { RegexPatternsProps } from './types';

export const RegexPatterns: React.FC<RegexPatternsProps> = ({
    patterns,
    onAdd,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    isDragged
}) => {
    const [inputValue, setInputValue] = React.useState('');

    const handleAdd = () => {
        if (inputValue.trim()) {
            onAdd(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <Stack spacing={0.5}>
            {patterns.map((pattern, patternIndex) => (
                <Paper 
                    key={patternIndex} 
                    variant="outlined" 
                    draggable
                    onDragStart={() => onDragStart(patternIndex)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(patternIndex)}
                    sx={{ 
                        p: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        cursor: 'grab',
                        '&:active': {
                            cursor: 'grabbing',
                        },
                        opacity: isDragged(patternIndex) ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                    }}
                >
                    <DragIndicatorIcon 
                        fontSize="small" 
                        sx={{ color: 'text.secondary', cursor: 'grab' }}
                    />
                    <Chip 
                        label={`Priority ${pattern.priority}`} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                        sx={{ minWidth: 80 }}
                    />
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            flex: 1, 
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                        }}
                    >
                        {pattern.regex}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => onDelete(patternIndex)}
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Paper>
            ))}

            <Stack direction="row" spacing={1}>
                <TextField
                    size="small"
                    label="Regex Pattern"
                    fullWidth
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAdd();
                        }
                    }}
                    placeholder="e.g. ^([A-Z0-9-]+)"
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleAdd}
                    startIcon={<AddIcon fontSize="small" />}
                    sx={{ minWidth: 80 }}
                >
                    Add
                </Button>
            </Stack>
        </Stack>
    );
};