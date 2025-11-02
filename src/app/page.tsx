'use client';

import { useState } from 'react';
import Workspace from '../components/Workspace';
import DocumentList from '../components/DocumentList';

export default function Home() {
  const [selectedDocumentPath, setSelectedDocumentPath] = useState<string | null>(null);

  const handleDocumentSelect = (documentPath: string) => {
    setSelectedDocumentPath(documentPath);
  };

  const handleBackToList = () => {
    setSelectedDocumentPath(null);
  };

  if (!selectedDocumentPath) {
    return <DocumentList onDocumentSelect={handleDocumentSelect} />;
  }

  return <Workspace documentPath={selectedDocumentPath} onBackToList={handleBackToList} />;
}