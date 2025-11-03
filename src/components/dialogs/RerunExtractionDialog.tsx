import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';

interface RerunExtractionDialogProps {
    open: boolean;
    hasUnsavedChanges: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const RerunExtractionDialog: React.FC<RerunExtractionDialogProps> = ({
    open,
    hasUnsavedChanges,
    onConfirm,
    onCancel
}) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            fullWidth
            maxWidth="sm"
            aria-labelledby="rerun-dialog-title"
            aria-describedby="rerun-dialog-description"
        >
            <DialogTitle id="rerun-dialog-title" sx={{ pb: 1 }}>
                {hasUnsavedChanges ? 'Save & Rerun Extraction?' : 'Rerun Extraction?'}
            </DialogTitle>
            <DialogContent dividers sx={{ py: 2 }}>
                <DialogContentText id="rerun-dialog-description">
                    {hasUnsavedChanges
                        ? 'We will save your current rule changes and then clear all mapped fields to re-extract using those rules. Any manual edits or mappings will be lost. Continue?'
                        : 'This will clear all currently mapped fields and re-extract data using the current rules. Any manual edits or mappings will be lost. Continue?'}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button 
                    onClick={onCancel} 
                    color="inherit" 
                    variant="outlined"
                    sx={{ borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained"
                    disableFocusRipple
                    disableRipple
                    sx={{ borderRadius: 999, px: 2.5, py: 1, fontWeight: 600 }}
                >
                    {hasUnsavedChanges ? 'Save & Rerun' : 'Rerun Extraction'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
