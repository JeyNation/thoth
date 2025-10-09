import { useEffect } from 'react';
import type { BoundingBox } from '../types/mapping';

interface Params {
  enabled: boolean;
  scale: number;
}

export const useAutoCenterOnFocus = (
  focusedInputField: string | null | undefined,
  focusedInputLinkedBoxIds: Set<string>,
  boundingBoxes: BoundingBox[],
  containerRef: React.RefObject<HTMLDivElement | null>,
  { enabled, scale }: Params
) => {
  useEffect(() => {
    if (!enabled) return;
    if (!focusedInputField || focusedInputLinkedBoxIds.size === 0) return;
    const containerEl = containerRef.current;
    if (!containerEl) return;
    const targetBoxes = boundingBoxes.filter(b => b.generatedId && focusedInputLinkedBoxIds.has(b.generatedId));
    if (!targetBoxes.length) return;
    targetBoxes.sort((a,b) => {
      const aY = Math.min(...a.Points.map(p=>p.Y));
      const bY = Math.min(...b.Points.map(p=>p.Y));
      if (Math.abs(aY - bY) < 4) {
        const aX = Math.min(...a.Points.map(p=>p.X));
        const bX = Math.min(...b.Points.map(p=>p.X));
        return aX - bX;
      }
      return aY - bY;
    });
    const first = targetBoxes[0];
    if (!first) return;
    const xs = first.Points.map(p=>p.X); const ys = first.Points.map(p=>p.Y);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2; // unscaled
    const centerY = (minY + maxY) / 2;
    const desiredLeftUnclamped = centerX - (containerEl.clientWidth / 2) / scale;
    const desiredTopUnclamped  = centerY - (containerEl.clientHeight / 2) / scale;
    const maxScrollLeft = Math.max(0, containerEl.scrollWidth - containerEl.clientWidth);
    const maxScrollTop  = Math.max(0, containerEl.scrollHeight - containerEl.clientHeight);
    const desiredLeft = Math.min(maxScrollLeft, Math.max(0, desiredLeftUnclamped));
    const desiredTop  = Math.min(maxScrollTop,  Math.max(0, desiredTopUnclamped));
    containerEl.scrollTo({ left: desiredLeft, top: desiredTop, behavior: 'smooth' });
  }, [enabled, focusedInputField, focusedInputLinkedBoxIds, boundingBoxes, containerRef, scale]);
};
