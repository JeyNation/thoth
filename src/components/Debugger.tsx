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

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
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
                <Chip
                    size="small"
                    color="default"
                    label={`${boundingBoxes.length} boxes`}
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.85)',
                        fontWeight: 500,
                        height: 22,
                    }}
                />
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
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    gap: 1.5,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.8rem',
                }}
            >
                <DebuggerInfo label="Focused Input" value={focusedInputField || 'none'} />
                <DebuggerInfo label="Focused Box" value={focusedBoundingBoxId || 'none'} />
                <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Sources
                    </Typography>
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
                            maxHeight: 160,
                            overflow: 'auto',
                        }}
                    >
                        {JSON.stringify(fieldSources, null, 2)}
                    </Box>
                </Box>
                {focusedBox ? (
                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Box Geometry
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                            {`ID: ${focusedBox.generatedId}`}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {`[L${focusedBox.minX} T${focusedBox.minY} R${focusedBox.maxX} B${focusedBox.maxY}]`}
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            Box Geometry
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                            none
                        </Typography>
                    </Box>
                )}
            </Box>

            {linkedFormFieldsForFocusedBox.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
                        Linked Form Inputs
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

            {geometryDetails && geometryDetails.ids.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
                        Geometry
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {geometryDetails.boxes.map((b) => (
                            <Typography
                                key={b.id}
                                variant="body2"
                                title={b.id}
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    color: 'rgba(255,255,255,0.85)',
                                    wordBreak: 'break-all',
                                }}
                            >
                                {`${b.id} [L${b.left} T${b.top} R${b.right} B${b.bottom}]`}
                            </Typography>
                        ))}
                    </Stack>
                </Box>
            )}
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
