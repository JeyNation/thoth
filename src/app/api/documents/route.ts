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
  pageCount?: number;
}

export async function GET() {
  try {
    // Path to the metadata file
    const metadataPath = path.join(process.cwd(), 'public', 'data', 'documents.json');
    
    // Read the metadata file
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Read each document to get page count
    const documentsWithPageCount = await Promise.all(
      metadata.documents.map(async (doc: any) => {
        try {
          const docPath = path.join(process.cwd(), 'public', 'data', doc.fileName);
          const docContent = await fs.readFile(docPath, 'utf-8');
          const docData = JSON.parse(docContent);
          const pageCount = docData.SvgInfo?.SvgImages?.length || 1;
          
          return {
            ...doc,
            path: `/data/${doc.fileName}`,
            pageCount
          };
        } catch (error) {
          console.error(`Error reading document ${doc.fileName}:`, error);
          return {
            ...doc,
            path: `/data/${doc.fileName}`,
            pageCount: 1
          };
        }
      })
    );
    
    return NextResponse.json({ documents: documentsWithPageCount });
  } catch (error) {
    console.error('Error reading documents metadata:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}
