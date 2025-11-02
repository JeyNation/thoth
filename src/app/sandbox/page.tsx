'use client';

import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

export default function SandboxPage() {
    const [boundingBoxes, setBoundingBoxes] = useState('[]');
    const [layoutMap, setLayoutMap] = useState('{}');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    const loadDemoData = async () => {
        setDataLoading(true);
        try {
            const [docResponse, layoutResponse] = await Promise.all([
                fetch('/data/documents/demo_2501161.json'),
                fetch('/data/layout_maps/demo_2501161_layout.json')
            ]);

            const docData = await docResponse.json();
            const layoutData = await layoutResponse.json();

            setBoundingBoxes(JSON.stringify(docData.BoundingBoxes || [], null, 2));
            setLayoutMap(JSON.stringify(layoutData, null, 2));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load demo data');
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        loadDemoData();
    }, []);

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

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
                Extraction API Sandbox
            </Typography>

            <Button 
                variant="outlined" 
                onClick={loadDemoData}
                sx={{ mb: 2 }}
                disabled={dataLoading}
            >
                {dataLoading ? 'Loading...' : 'Reload Demo Data'}
            </Button>

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
