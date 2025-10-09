import { useRef, useState, useEffect } from 'react';

export interface UseZoomPanOptions {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  zoomDurationMs?: number;
}

export interface UseZoomPanResult {
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  // containerRef may be null before mount
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  isSpacePressed: boolean;
  setIsSpacePressed: React.Dispatch<React.SetStateAction<boolean>>;
  position: { x: number; y: number };
  resetView: () => void;
}

export const useZoomPan = (opts?: UseZoomPanOptions): UseZoomPanResult => {
  const { initialScale = 1, minScale = 0.1, maxScale = 5, zoomDurationMs = 180 } = opts || {};
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation refs
  const scaleRef = useRef(scale);
  const zoomFromRef = useRef(scale);
  const zoomToRef = useRef(scale);
  const zoomStartRef = useRef<number | null>(null);
  const zoomDurationRef = useRef(zoomDurationMs);
  const zoomRafRef = useRef<number | null>(null);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Alt+wheel zoom (non-passive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      const wheelDelta = e.deltaY;
      const rawFactor = Math.pow(1.0015, -wheelDelta);
      const boundedFactor = Math.min(2, Math.max(0.5, rawFactor));
      const current = scaleRef.current;
      let target = current * boundedFactor;
      target = Math.max(minScale, Math.min(maxScale, target));
      zoomFromRef.current = current;
      zoomToRef.current = target;
      zoomStartRef.current = null;
      if (zoomRafRef.current != null) cancelAnimationFrame(zoomRafRef.current);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const animate = (ts: number) => {
        if (zoomStartRef.current == null) zoomStartRef.current = ts;
        const elapsed = ts - zoomStartRef.current;
        const dur = zoomDurationRef.current;
        const t = Math.min(1, elapsed / dur);
        const eased = easeOutCubic(t);
        const nextScale = zoomFromRef.current + (zoomToRef.current - zoomFromRef.current) * eased;
        if (containerRef.current) {
          setPosition({ x: -(containerRef.current.scrollLeft), y: -(containerRef.current.scrollTop) });
        }
        setScale(nextScale);
        if (t < 1) zoomRafRef.current = requestAnimationFrame(animate); else zoomRafRef.current = null;
      };
      zoomRafRef.current = requestAnimationFrame(animate);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => { el.removeEventListener('wheel', handleWheel as EventListener); if (zoomRafRef.current) cancelAnimationFrame(zoomRafRef.current); };
  }, [minScale, maxScale]);

  // Spacebar hold for panning
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) { e.preventDefault(); setIsSpacePressed(true); }
    };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { setIsSpacePressed(false); setIsDragging(false); } };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isSpacePressed]);

  // Mouse move logic for panning
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (isDragging && containerRef.current && isSpacePressed) {
        const dx = e.clientX - lastMousePos.x; const dy = e.clientY - lastMousePos.y;
        containerRef.current.scrollLeft -= dx;
        containerRef.current.scrollTop -= dy;
        setPosition({ x: -containerRef.current.scrollLeft, y: -containerRef.current.scrollTop });
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [isDragging, isSpacePressed, lastMousePos]);

  const resetView = () => {
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
    if (containerRef.current) { containerRef.current.scrollLeft = 0; containerRef.current.scrollTop = 0; }
  };

  return { scale, setScale, containerRef, isDragging, setIsDragging, isSpacePressed, setIsSpacePressed, position, resetView };
};

// Helper handlers to integrate with component
export interface ZoomPanHandlers {
  onContainerMouseDown: (e: React.MouseEvent) => void;
  onContainerMouseUp: () => void;
}

export const createZoomPanHandlers = (api: UseZoomPanResult): ZoomPanHandlers => ({
  onContainerMouseDown: (_e) => { if (api.isSpacePressed) api.setIsDragging(true); },
  onContainerMouseUp: () => api.setIsDragging(false)
});
