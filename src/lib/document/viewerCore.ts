export type Point = { x: number; y: number };

export type BoundingBox = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  page?: number;
  fieldId?: string;
  fieldText?: string;
  points?: Point[];
};

export function calculateBounds(points: Point[] = []): { top: number; left: number; right: number; bottom: number } {
  if (points.length === 0) return { top: 0, left: 0, right: 0, bottom: 0 };
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

export function normalizeText(text?: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export function areaOf(box: BoundingBox): number {
  return Math.max(0, box.right - box.left) * Math.max(0, box.bottom - box.top);
}
