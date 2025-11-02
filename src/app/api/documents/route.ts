import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export interface DocumentMetadata {
  id: string;
  displayName: string;
  description?: string;
  fileName: string;
  createdDate?: string;
  path: string;
}

export async function GET() {
  try {
    // Path to the metadata file
    const metadataPath = path.join(process.cwd(), 'public', 'data', 'documents.json');
    
    // Read the metadata file
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Add the full path to each document
    const documents: DocumentMetadata[] = metadata.documents.map((doc: any) => ({
      ...doc,
      path: `/data/${doc.fileName}`
    }));
    
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error reading documents metadata:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}
