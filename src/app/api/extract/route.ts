import { NextResponse } from 'next/server';

import { ExtractionEngine, type FieldExtraction } from '@/services/extractionEngine';
import type { BoundingBox } from '@/types/boundingBox';
import type { LayoutMap } from '@/types/extractionRules';

export interface ExtractionRequest {
    boundingBoxes: BoundingBox[];
    layoutMap: LayoutMap;
}

export interface ExtractionResult {
    extractions: FieldExtraction[];
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
                { error: 'layoutMap.id is required' },
                { status: 400 }
            );
        }
        
        const engine = new ExtractionEngine(body.boundingBoxes, body.layoutMap);
        const engineResult = engine.extract();
        
        const result: ExtractionResult = {
            extractions: engineResult.extractions,
            matchedRules: engineResult.matchedRules,
            unmatchedRules: engineResult.unmatchedRules,
            errors: engineResult.errors
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
