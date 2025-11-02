import { NextResponse } from 'next/server';
import type { LayoutMap } from '@/types/extractionRules';

export interface BoundingBox {
    generatedId: string;
    text: string;
    page: number;
    points: Array<{ x: number; y: number }>;
    confidence?: number;
}

export interface ExtractionRequest {
    boundingBoxes: BoundingBox[];
    layoutMap: LayoutMap;
}

export interface ExtractionResult {
    extractedData: Record<string, string>;
    matchedRules: string[];
    unmatchedRules: string[];
    errors?: string[];
}

export async function POST(request: Request) {
    try {
        const body: ExtractionRequest = await request.json();
        
        if (!body.boundingBoxes || !Array.isArray(body.boundingBoxes)) {
            return NextResponse.json(
                { error: 'boundingBoxes array is required' },
                { status: 400 }
            );
        }
        
        if (!body.layoutMap) {
            return NextResponse.json(
                { error: 'layoutMap is required' },
                { status: 400 }
            );
        }
        
        if (!body.layoutMap.id) {
            return NextResponse.json(
                { error: 'layoutMap.map_id is required' },
                { status: 400 }
            );
        }
        
        const result: ExtractionResult = {
            extractedData: {},
            matchedRules: [],
            unmatchedRules: [],
            errors: ['Extraction engine not implemented yet']
        };
        
        return NextResponse.json(result);
        
    } catch (error) {
        console.error('Extraction API error:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
