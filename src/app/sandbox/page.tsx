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
    const [dataLoading, setDataLoading] = useState(true);
    
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

            // Set defaults
            if (docsData.documents.length > 0) {
                setSelectedDocument(docsData.documents[0].fileName);
            }
            if (layoutsData.layouts.length > 0) {
                setSelectedLayout(layoutsData.layouts[0].fileName);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load available data');
        }
    };

    const loadSelectedData = async () => {
        if (!selectedDocument || !selectedLayout) return;
        
        setDataLoading(true);
        try {
            const [docResponse, layoutResponse] = await Promise.all([
                fetch(`/data/documents/${selectedDocument}`),
                fetch(`/data/layout_maps/${selectedLayout}`)
            ]);

            const docData = await docResponse.json();
            const layoutData = await layoutResponse.json();

            setBoundingBoxes(JSON.stringify(docData.boundingBoxes || [], null, 2));
            setLayoutMap(JSON.stringify(layoutData, null, 2));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load selected data');
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        loadAvailableData();
    }, []);

    useEffect(() => {
        if (selectedDocument && selectedLayout) {
            loadSelectedData();
        }
    }, [selectedDocument, selectedLayout]);

    const handleExtract = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const boundingBoxesJson = JSON.parse(boundingBoxes);
            const layoutMapJson = JSON.parse(layoutMap);

            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    boundingBoxes: boundingBoxesJson,
                    layoutMap: layoutMapJson,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(JSON.stringify(data, null, 2));
            } else {
                setResult(data);
            }
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
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
                Extraction API Sandbox
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>Document</InputLabel>
                    <Select
                        value={selectedDocument}
                        label="Document"
                        onChange={handleDocumentChange}
                        disabled={dataLoading}
                    >
                        {documents.map((doc) => (
                            <MenuItem key={doc.id} value={doc.fileName}>
                                {doc.displayName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Layout Rules</InputLabel>
                    <Select
                        value={selectedLayout}
                        label="Layout Rules"
                        onChange={handleLayoutChange}
                        disabled={dataLoading}
                    >
                        {layouts.map((layout) => (
                            <MenuItem key={layout.id} value={layout.fileName}>
                                {layout.displayName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Paper sx={{ flex: 1, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Bounding Boxes (JSON)
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={15}
                        value={boundingBoxes}
                        onChange={(e) => setBoundingBoxes(e.target.value)}
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                </Paper>

                <Paper sx={{ flex: 1, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Layout Map (JSON)
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={15}
                        value={layoutMap}
                        onChange={(e) => setLayoutMap(e.target.value)}
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                </Paper>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                    variant="contained" 
                    onClick={handleExtract}
                    disabled={loading}
                    size="large"
                >
                    {loading ? 'Extracting...' : 'Extract'}
                </Button>
            </Box>

            {error && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: '#ffebee' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        Error
                    </Typography>
                    <pre style={{ overflow: 'auto' }}>{error}</pre>
                </Paper>
            )}

            {result && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: '#e8f5e9' }}>
                    <Typography variant="h6" gutterBottom>
                        Result
                    </Typography>
                    <pre style={{ overflow: 'auto' }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </Paper>
            )}
        </Box>
    );
}
