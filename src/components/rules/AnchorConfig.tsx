import React from 'react';
import { Stack, Chip, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { AnchorConfigProps } from '../../types/rulesComponents';
import { SubsectionLabel } from '../common/SubsectionLabel';
import { TextInput } from '../common/TextInput';
import { TextButton } from '../common/TextButton';

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
            <SubsectionLabel>Anchor Text</SubsectionLabel>
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
                <TextInput
                    fullWidth
                    value={inputValue}
                    onChange={onInputChange}
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
                        <TextButton
                            onClick={() => onUpdate(inputValue)}
                            startIcon={<CheckIcon fontSize="small" />}
                        >
                            Update
                        </TextButton>
                        <TextButton
                            variant="outlined"
                            onClick={onCancel}
                            startIcon={<CloseIcon fontSize="small" />}
                        >
                            Cancel
                        </TextButton>
                    </>
                ) : (
                    <TextButton
                        onClick={() => onAdd(inputValue)}
                        startIcon={<AddIcon fontSize="small" />}
                    >
                        Add
                    </TextButton>
                )}
            </Stack>
        </Box>
    );
};