import type { BoundingBox as BaseBoundingBox } from './boundingBox';

export interface BoundingBox extends BaseBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface FieldSourceGeom {
  id: string;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface FieldSourceEntry {
  ids: string[];
  boxes: FieldSourceGeom[];
}

export type FieldSources = Record<string, FieldSourceEntry>;

export type ReverseFieldSourceIndex = Record<string, string[]>;

export interface SourceWithGeometry {
  fieldId: string;
  ids: string[];
  boxes: FieldSourceGeom[];
}

export interface MultiFieldPair {
  fieldId: string;
  boxId: string;
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

export const normalizeBoundingBoxes = (raw: BaseBoundingBox[]): BoundingBox[] => {
  return raw.map((box, index) => {
    const xs = box.points.map(p => p.x);
    const ys = box.points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return {
      ...box,
      id: `bbox-${box.fieldId}-${index}`,
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  });
};
