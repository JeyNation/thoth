'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

interface DocumentInfo {
    id: string;
    displayName: string;
    description: string;
    fileName: string;
    createdDate: string;
}

interface LayoutInfo {
    id: string;
    displayName: string;
    description: string;
    fileName: string;
    createdDate: string;
}

export default function SandboxPage() {
    const [boundingBoxes, setBoundingBoxes] = useState('[]');
    const [layoutMap, setLayoutMap] = useState('{}');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [layouts, setLayouts] = useState<LayoutInfo[]>([]);
    const [selectedDocument, setSelectedDocument] = useState('');
    const [selectedLayout, setSelectedLayout] = useState('');

    const loadAvailableData = async () => {
        try {
            const [docsResponse, layoutsResponse] = await Promise.all([
                fetch('/data/documents.json'),
                fetch('/data/layouts.json')
            ]);

            const docsData = await docsResponse.json();
            const layoutsData = await layoutsResponse.json();

            setDocuments(docsData.documents || []);
            setLayouts(layoutsData.layouts || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load available data');
        }
    };

    const loadSelectedData = async () => {
        if (!selectedDocument || !selectedLayout) return;
        
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const [docResponse, layoutResponse] = await Promise.all([
                fetch(`/data/documents/${selectedDocument}`),
                fetch(`/data/layout_maps/${selectedLayout}`)
            ]);

            const docData = await docResponse.json();
            const layoutData = await layoutResponse.json();

            const boundingBoxesStr = JSON.stringify(docData.boundingBoxes || [], null, 2);
            const layoutMapStr = JSON.stringify(layoutData, null, 2);

            setBoundingBoxes(boundingBoxesStr);
            setLayoutMap(layoutMapStr);

            // Auto-extract after loading
            await extractData(docData.boundingBoxes || [], layoutData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load selected data');
        } finally {
            setLoading(false);
        }
    };

    const extractData = async (boundingBoxesData: any, layoutMapData: any) => {
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    boundingBoxes: boundingBoxesData,
                    layoutMap: layoutMapData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(JSON.stringify(data, null, 2));
            } else {
                setResult(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error during extraction');
        }
    };

    useEffect(() => {
        loadAvailableData();
    }, []);

    const handleExtract = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const boundingBoxesJson = JSON.parse(boundingBoxes);
            const layoutMapJson = JSON.parse(layoutMap);

            await extractData(boundingBoxesJson, layoutMapJson);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentChange = (event: SelectChangeEvent) => {
        setSelectedDocument(event.target.value);
    };

    const handleLayoutChange = (event: SelectChangeEvent) => {
        setSelectedLayout(event.target.value);
    };

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h4" sx={{ flexShrink: 0, fontWeight: 600 }}>
                Extraction API Sandbox
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
                <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Document</InputLabel>
                    <Select
                        value={selectedDocument}
                        label="Document"
                        onChange={handleDocumentChange}
                    >
                        {documents.map((doc) => (
                            <MenuItem key={doc.id} value={doc.fileName}>
                                {doc.displayName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Layout Rules</InputLabel>
                    <Select
                        value={selectedLayout}
                        label="Layout Rules"
                        onChange={handleLayoutChange}
                    >
                        {layouts.map((layout) => (
                            <MenuItem key={layout.id} value={layout.fileName}>
                                {layout.displayName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button 
                    variant="contained"
                    onClick={loadSelectedData}
                    disabled={!selectedDocument || !selectedLayout || loading}
                    sx={{ minWidth: '120px', height: '56px' }}
                >
                    {loading ? 'Loading...' : 'Load & Extract'}
                </Button>
            </Box>

            {result && (
                <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Paper elevation={1} sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Bounding Boxes (JSON)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            value={boundingBoxes}
                            onChange={(e) => setBoundingBoxes(e.target.value)}
                            variant="outlined"
                            sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '12px', 
                                flex: 1,
                                '& .MuiInputBase-root': {
                                    height: '100%',
                                    alignItems: 'flex-start'
                                },
                                '& textarea': {
                                    height: '100% !important',
                                    overflow: 'auto !important'
                                }
                            }}
                        />
                    </Paper>

                    <Paper elevation={1} sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Layout Map (JSON)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            value={layoutMap}
                            onChange={(e) => setLayoutMap(e.target.value)}
                            variant="outlined"
                            sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '12px', 
                                flex: 1,
                                '& .MuiInputBase-root': {
                                    height: '100%',
                                    alignItems: 'flex-start'
                                },
                                '& textarea': {
                                    height: '100% !important',
                                    overflow: 'auto !important'
                                }
                            }}
                        />
                    </Paper>

                    <Paper elevation={1} sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Result
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            value={result ? JSON.stringify(result, null, 2) : ''}
                            variant="outlined"
                            InputProps={{
                                readOnly: true,
                            }}
                            sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '12px', 
                                flex: 1,
                                bgcolor: '#e8f5e9',
                                '& .MuiInputBase-root': {
                                    height: '100%',
                                    alignItems: 'flex-start',
                                    bgcolor: '#e8f5e9'
                                },
                                '& textarea': {
                                    height: '100% !important',
                                    overflow: 'auto !important'
                                }
                            }}
                        />
                    </Paper>
                </Box>
            )}

            {error && (
                <Paper elevation={1} sx={{ p: 2, bgcolor: '#ffebee', maxHeight: '150px', overflow: 'auto', flexShrink: 0, borderRadius: 3 }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        Error
                    </Typography>
                    <pre style={{ margin: 0, overflow: 'auto' }}>{error}</pre>
                </Paper>
            )}
        </Box>
    );
}
