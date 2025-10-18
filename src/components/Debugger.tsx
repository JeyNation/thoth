import React, { useMemo } from 'react';
import { Box, IconButton, Stack, Typography, Divider, Chip } from '@mui/material';
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
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={{ color: 'common.white', fontWeight: 600, letterSpacing: 0.6 }}>
                    Connections Debug
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                    size="small"
                    aria-label="Hide debug panel"
                    title="Hide debug panel"
                    onClick={onHide}
                    sx={{
                        color: 'common.white',
                        border: '1px solid rgba(255,255,255,0.18)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.16)',
                            borderColor: 'rgba(255,255,255,0.28)',
                        },
                    }}
                >
                    <VisibilityOffIcon fontSize="small" />
                </IconButton>
            </Stack>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    minHeight: 0,
                    flex: 1,
                }}
            >
                <Stack spacing={1.5} sx={{ minWidth: 0, minHeight: 0, overflow: 'auto', pr: 1 }}>
                    {focusedBoundingBoxId && focusedBox ? (
                        <>
                            {/* Focused Box */}
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                    Focused Box
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                                    {focusedBoundingBoxId}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {`[L${focusedBox.minX} T${focusedBox.minY} R${focusedBox.maxX} B${focusedBox.maxY}]`}
                                </Typography>
                            </Box>

                            {linkedFormFieldsForFocusedBox.length > 0 && (
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
                                        Linked Inputs
                                    </Typography>
                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                        {linkedFormFieldsForFocusedBox.map((fid) => (
                                            <Typography
                                                key={fid}
                                                variant="body2"
                                                title={fid}
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.75rem',
                                                    color: 'rgba(255,255,255,0.85)',
                                                    wordBreak: 'break-all',
                                                }}
                                            >
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
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                    Focused Input
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                                    {focusedInputField}
                                </Typography>
                            </Box>

                            {/* Geometry (for Focused Input) */}
                            {geometryDetails && geometryDetails.ids.length > 0 ? (
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
                                        Linked Boxes
                                    </Typography>
                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                        {geometryDetails.boxes.map((b) => (
                                            <Box key={b.id}>
                                                <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                                                    {b.id}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
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
                    <Box
                        component="pre"
                        sx={{
                            mt: 0.5,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: 'rgba(0,0,0,0.35)',
                            fontSize: '0.7rem',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflow: 'auto',
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
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
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {label}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
            {value}
        </Typography>
    </Box>
);
