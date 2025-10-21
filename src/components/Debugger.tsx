import React, { useMemo } from 'react';
import { Box, IconButton, Stack, Typography, Divider } from '@mui/material';
import {
    DEBUGGER_CONTAINER_SX,
    DEBUGGER_HEADER_TITLE_SX,
    DEBUGGER_HIDE_BUTTON_SX,
    DEBUGGER_DIVIDER_SX,
    DEBUGGER_GRID_SX,
    DEBUGGER_LEFT_STACK_SX,
    DEBUGGER_CAPTION_SX,
    DEBUGGER_BODY_SMALL_SX,
    DEBUGGER_BODY_SMALL_PLAIN_SX,
    DEBUGGER_LINKED_INPUTS_LETTER_SX,
    DEBUGGER_LINKED_ID_SX,
    DEBUGGER_PRE_SX,
    DEBUGGER_INFO_LABEL_SX,
    DEBUGGER_INFO_VALUE_SX,
} from '../styles/debuggerStyles';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { BoundingBox } from '../types/mapping';
import { useMapping } from '../context/MappingContext';

interface DebuggerProps {
    boundingBoxes: BoundingBox[];
    focusedInputField: string | null;
    focusedBoundingBoxId?: string | null;
    onHide: () => void;
}

const Debugger: React.FC<DebuggerProps> = ({ boundingBoxes, focusedInputField, focusedBoundingBoxId, onHide }) => {
    const { fieldSources } = useMapping();

    const { linkedFormFieldsForFocusedBox, focusedBox } = useMemo(() => {
        const linked = focusedBoundingBoxId
            ? Object.entries(fieldSources)
                .filter(([, entry]) => entry.ids.includes(focusedBoundingBoxId))
                .map(([fid]) => fid)
            : [];
        const box = focusedBoundingBoxId
            ? boundingBoxes.find(b => b.generatedId === focusedBoundingBoxId)
            : null;
        return { linkedFormFieldsForFocusedBox: linked, focusedBox: box };
    }, [boundingBoxes, fieldSources, focusedBoundingBoxId]);

    const geometryDetails = focusedInputField ? fieldSources[focusedInputField] : undefined;
    const fieldSourcesJson = useMemo(() => JSON.stringify(fieldSources, null, 2), [fieldSources]);

    return (
        <Box sx={DEBUGGER_CONTAINER_SX}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={DEBUGGER_HEADER_TITLE_SX}>
                    Connections Debug
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                    size="small"
                    aria-label="Hide debug panel"
                    title="Hide debug panel"
                    onClick={onHide}
                    sx={DEBUGGER_HIDE_BUTTON_SX}
                >
                    <VisibilityOffIcon fontSize="small" />
                </IconButton>
            </Stack>

            <Divider sx={DEBUGGER_DIVIDER_SX} />

            <Box sx={DEBUGGER_GRID_SX}>
                <Stack spacing={1.5} sx={DEBUGGER_LEFT_STACK_SX}>
                    {focusedBoundingBoxId && focusedBox ? (
                        <>
                            {/* Focused Box */}
                            <Box>
                                <Typography variant="caption" sx={DEBUGGER_CAPTION_SX}>
                                    Focused Box
                                </Typography>
                                <Typography variant="body2" sx={DEBUGGER_BODY_SMALL_SX}>
                                    {focusedBoundingBoxId}
                                </Typography>
                                <Typography variant="body2" sx={DEBUGGER_BODY_SMALL_PLAIN_SX}>
                                    {`[L${focusedBox.minX} T${focusedBox.minY} R${focusedBox.maxX} B${focusedBox.maxY}]`}
                                </Typography>
                            </Box>

                            {linkedFormFieldsForFocusedBox.length > 0 && (
                                <Box>
                                    <Typography variant="caption" sx={DEBUGGER_LINKED_INPUTS_LETTER_SX}>
                                        Linked Inputs
                                    </Typography>
                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                        {linkedFormFieldsForFocusedBox.map((fid) => (
                                            <Typography key={fid} variant="body2" title={fid} sx={DEBUGGER_LINKED_ID_SX}>
                                                {fid}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </>
                    ) : null}

                    {focusedInputField ? (
                        <>
                            {/* Focused Input */}
                            <Box>
                                <Typography variant="caption" sx={DEBUGGER_CAPTION_SX}>
                                    Focused Input
                                </Typography>
                                <Typography variant="body2" sx={DEBUGGER_BODY_SMALL_SX}>
                                    {focusedInputField}
                                </Typography>
                            </Box>

                            {/* Geometry (for Focused Input) */}
                            {geometryDetails && geometryDetails.ids.length > 0 ? (
                                <Box>
                                    <Typography variant="caption" sx={DEBUGGER_LINKED_INPUTS_LETTER_SX}>
                                        Linked Boxes
                                    </Typography>
                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                        {geometryDetails.boxes.map((b) => (
                                            <Box key={b.id}>
                                                <Typography variant="body2" sx={DEBUGGER_BODY_SMALL_SX}>
                                                    {b.id}
                                                </Typography>
                                                <Typography variant="body2" sx={DEBUGGER_BODY_SMALL_PLAIN_SX}>
                                                    {`[L${b.left} T${b.top} R${b.right} B${b.bottom}]`}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            ) : null}
                        </>
                    ) : null}
                </Stack>

                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <Box component="pre" sx={DEBUGGER_PRE_SX}>
                        {fieldSourcesJson}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Debugger;

interface DebuggerInfoProps {
    label: string;
    value: string | number;
}

const DebuggerInfo: React.FC<DebuggerInfoProps> = ({ label, value }) => (
    <Box>
        <Typography variant="caption" sx={DEBUGGER_INFO_LABEL_SX}>
            {label}
        </Typography>
        <Typography variant="body2" sx={DEBUGGER_INFO_VALUE_SX}>
            {value}
        </Typography>
    </Box>
);
