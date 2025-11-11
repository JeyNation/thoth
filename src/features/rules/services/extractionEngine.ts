// Minimal extraction engine scaffold for feature migration and TDD
import type { BoundingBox } from '@/types/boundingBox';

export interface ExtractionResult {
  extractionFieldId: string;
  value: string;
}

export class ExtractionEngine {
  constructor(private boundingBoxes: BoundingBox[] = []) {}

  public extract(): ExtractionResult[] {
    // placeholder behavior for scaffolding
    return [];
  }
}
