import type { BoundingBox } from '@/types/boundingBox';

export function highlightBoxes(boxes: BoundingBox[]) {
  // adapter placeholder: feature can call into viewerCore or emit events to viewer
  return boxes.map(b => ({ id: b.fieldId }));
}
