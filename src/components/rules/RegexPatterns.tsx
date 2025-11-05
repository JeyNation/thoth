import React, { useImperativeHandle, forwardRef } from 'react';
import { Paper, Stack, Typography, Chip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { RegexPatternsProps } from '../../types/rulesComponents';
import { IconButton } from '../common/IconButton';
import { TextButton } from '../common/TextButton';
import { TextInput } from '../common/TextInput';

export interface RegexPatternsRef {
    applyPendingChanges: () => void;
    getPendingChanges: () => { pendingPattern?: string };
}

export const RegexPatterns = forwardRef<RegexPatternsRef, RegexPatternsProps>(({
    patterns,
    onAdd,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    isDragged
}, ref) => {
    const [inputValue, setInputValue] = React.useState('');

    // Expose method to apply pending changes
    useImperativeHandle(ref, () => ({
        applyPendingChanges: () => {
            const pendingPattern = inputValue.trim();
            console.log('RegexPatterns.applyPendingChanges called, inputValue:', inputValue);
            if (pendingPattern) {
                console.log('Adding pending regex pattern:', pendingPattern);
                onAdd(pendingPattern);
                setInputValue(''); // Clear the input after applying
            }
        },
        getPendingChanges: () => {
            const pendingPattern = inputValue.trim();
            return pendingPattern ? { pendingPattern } : {};
        }
    }), [inputValue, onAdd]);

    const handleAdd = () => {
        if (inputValue.trim()) {
            onAdd(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <Stack spacing={1}>
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
                        icon={DeleteOutlineIcon}
                        tooltip="Delete pattern"
                        onClick={() => onDelete(patternIndex)}
                        color="error"
                    />
                </Paper>
            ))}

            <Stack direction="row" spacing={1}>
                <TextInput
                    label="Regex Pattern"
                    fullWidth
                    value={inputValue}
                    onChange={setInputValue}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleAdd();
                        }
                    }}
                    placeholder="e.g. ^([A-Z0-9-]+)"
                />
                <TextButton
                    size="medium"
                    onClick={handleAdd}
                    startIcon={<AddIcon fontSize="small" />}
                    sx={{ minWidth: 80}}
                >
                    Add
                </TextButton>
            </Stack>
        </Stack>
    );
});

RegexPatterns.displayName = 'RegexPatterns';