'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

export interface DocumentMetadata {
  id: string;
  displayName: string;
  description?: string;
  fileName: string;
  createdDate?: string;
  path: string;
  pageCount?: number;
}

interface DocumentListProps {
  onDocumentSelect: (documentPath: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onDocumentSelect }) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Typography variant="body1" color="text.secondary" fontStyle="italic">
          Loading documents...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 3,
      }}
    >
      {documents.length === 0 ? (
        <Alert severity="info">No documents found in the data folder.</Alert>
      ) : (
        <Paper elevation={2}>
          <List>
            {documents.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => onDocumentSelect(doc.path)}
                    sx={{
                      py: 2,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: '100%',
                      }}
                    >
                      <DescriptionIcon color="primary" fontSize="large" />
                      <ListItemText
                        primary={doc.displayName}
                        secondary={
                          <>
                            {doc.description || doc.fileName}
                            {doc.pageCount && doc.pageCount > 1 && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{
                                  ml: 1,
                                  color: 'primary.main',
                                  fontWeight: 500,
                                }}
                              >
                                ({doc.pageCount} pages)
                              </Typography>
                            )}
                          </>
                        }
                        primaryTypographyProps={{
                          variant: 'h6',
                          component: 'div',
                        }}
                        secondaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < documents.length - 1 && <Box component="hr" sx={{ m: 0, border: 'none', borderBottom: 1, borderColor: 'divider' }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default DocumentList;
