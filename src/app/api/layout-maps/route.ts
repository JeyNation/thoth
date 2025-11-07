import { promises as fs } from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';

import type { LayoutMap } from '@/types/extractionRules';

export async function POST(request: Request) {
    try {
        const layoutMap: LayoutMap = await request.json();
        
        if (!layoutMap.vendorId) {
            return NextResponse.json(
                { error: 'vendorId is required' },
                { status: 400 }
            );
        }
        
        // Update the updatedAt timestamp
        layoutMap.updatedAt = new Date().toISOString();
        
        // Construct the file path
        const fileName = `${layoutMap.vendorId}_rules.json`;
        const filePath = path.join(process.cwd(), 'public', 'data', 'layout_maps', fileName);
        
        // Write the file
        await fs.writeFile(filePath, JSON.stringify(layoutMap, null, 2), 'utf-8');
        
        return NextResponse.json({ 
            success: true, 
            message: 'Layout map saved successfully',
            layoutMap 
        });
        
    } catch (error) {
        console.error('Save layout map error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to save layout map',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
