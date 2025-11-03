import React from 'react';
import { Stack, TextField, Button, Chip, Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { AnchorConfigProps } from './types';

export const AnchorConfig: React.FC<AnchorConfigProps> = ({
    anchors,
    onAdd,
    onDelete,
    onEdit,
    onUpdate,
    onCancel,
    editingIndex,
    inputValue,
    onInputChange
}) => {
    return (
        <Box>
            <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                    display: 'block',
                    textTransform: 'uppercase',
                    mb: 0.5,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em'
                }}
            >
                Anchor Text
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="wrap" sx={{ mb: 1 }}>
                {anchors.map((anchor, anchorIndex) => (
                    <Chip
                        key={anchorIndex}
                        label={anchor}
                        size="small"
                        onDelete={() => onDelete(anchorIndex)}
                        onClick={() => onEdit(anchorIndex)}
                        deleteIcon={<DeleteOutlineIcon fontSize="small" />}
                        sx={{ mb: 0.5 }}
                    />
                ))}
            </Stack>
            <Stack direction="row" spacing={1}>
                <TextField
                    size="small"
                    fullWidth
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            if (editingIndex !== null) {
                                onUpdate(inputValue);
                            } else {
                                onAdd(inputValue);
                            }
                        }
                    }}
                />
                {editingIndex !== null ? (
                    <>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => onUpdate(inputValue)}
                            startIcon={<CheckIcon fontSize="small" />}
                            sx={{ minWidth: 100 }}
                        >
                            Update
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onCancel}
                            startIcon={<CloseIcon fontSize="small" />}
                            sx={{ minWidth: 100 }}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => onAdd(inputValue)}
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{ minWidth: 80 }}
                    >
                        Add
                    </Button>
                )}
            </Stack>
        </Box>
    );
};