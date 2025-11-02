// Centralized shared mapping & geometry types

export interface RawBoundingBoxPoint { x: number; y: number; }
export interface RawBoundingBox {
  fieldId: string;
  fieldText: string;
  points: RawBoundingBoxPoint[];
  page: number;
}

// Normalized bounding box with generated id and cached geometry
export interface BoundingBox extends RawBoundingBox {
  generatedId: string; // always present after normalization
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface FieldSourceGeom { id: string; top: number; left: number; right: number; bottom: number; }
export interface FieldSourceEntry { ids: string[]; boxes: FieldSourceGeom[]; }
// Convenience aggregation / derived collections
export type FieldSources = Record<string, FieldSourceEntry>;
// Reverse lookup index: boxId -> array of fieldIds that reference it (constructed on demand)
export type ReverseFieldSourceIndex = Record<string, string[]>;
// Flattened form used by heuristic utilities (fieldId bundled alongside ids & boxes)
export interface SourceWithGeometry { fieldId: string; ids: string[]; boxes: FieldSourceGeom[]; }

// Drag multi-field pair (subset captured for mapping heuristics)
export interface MultiFieldPair {
  fieldId: string; // original OCR field id
  boxId: string;   // bounding box generatedId
  text: string;
  centerX?: number;
  centerY?: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface MultiFieldDragPayload {
  isMultiField?: boolean;
  pairs?: MultiFieldPair[];
  boundingBoxIds?: string[];
  fieldIds?: string[];
  text?: string;
}

export const isMultiFieldDragPayload = (val: unknown): val is MultiFieldDragPayload => {
  if (!val || typeof val !== 'object') return false;
  const v = val as any;
  if (v.pairs && !Array.isArray(v.pairs)) return false;
  if (v.boundingBoxIds && !Array.isArray(v.boundingBoxIds)) return false;
  return true;
};

export const normalizeBoundingBoxes = (raw: RawBoundingBox[]): BoundingBox[] => {
  return raw.map((box, index) => {
    const xs = box.points.map(p => p.x);
    const ys = box.points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return {
      ...box,
      generatedId: `bbox-${box.fieldId}-${index}`,
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  });
};
