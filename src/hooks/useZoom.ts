import { useRef, useState, useEffect } from 'react';

export interface UseZoomOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  zoomDurationMs?: number;
  autoFit?: {
    svgContent: string;
    svgHostRef: React.RefObject<HTMLDivElement | null>;
    mode?: 'width' | 'height' | 'contain';
    retries?: number;
    onApplied?: (appliedScale: number, meta: { mode: string; reason: string }) => void;
  };
}

export interface UseZoomResult {
  scale: number;
  isAltPressed: boolean;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  resetView: () => void;
}

export const useZoom = (opts: UseZoomOptions): UseZoomResult => {
  const { 
    containerRef,
    initialScale = 1, 
    minScale = 0.1, 
    maxScale = 5,
    autoFit 
  } = opts;

  const [autoFitTrigger, setAutoFitTrigger] = useState(0);
  const [scale, setScale] = useState(initialScale);
  const [isAltPressed] = useState(false);

  const autoFitAppliedRef = useRef(false);
  const scaleRef = useRef(scale);

  useEffect(() => {
    scaleRef.current = scale;

    if (!autoFit) return;

    const {
      svgContent,
      svgHostRef,
      mode = 'width',
      retries = 4,
      onApplied
    } = autoFit;

    if (autoFitAppliedRef.current) return;
    if (!svgContent) return; 

  const containerEl = containerRef.current as (HTMLElement | null);
    const hostEl = svgHostRef.current;
    if (!containerEl || !hostEl) return;

    let attempt = 0;
    let rafId: number | null = null;
    const EPS = 0.0005;

    const tryFit = (): boolean => {
      const svgEl = hostEl.querySelector('svg');
      if (!svgEl) return false;

      const bbox = svgEl.getBoundingClientRect();
      if (!bbox.width) return false;
      
      const containerWidth = containerEl.clientWidth;
      const containerHeight = containerEl.clientHeight || 1;
      
      if (!containerWidth || !containerHeight) return false;
      
      const svgWidth = bbox.width;
      const svgHeight = bbox.height || 1;
      const widthScale = containerWidth / svgWidth;
      const heightScale = containerHeight / svgHeight;
      
      let chosenScale: number;
      let reason = '';
      
      switch (mode) {
        case 'height': 
          chosenScale = heightScale; 
          reason = 'height-fit'; 
          break;

        case 'contain':
          chosenScale = Math.min(widthScale, heightScale); 
          reason = widthScale < heightScale 
            ? 'contain-width-bound' 
            : 'contain-height-bound'; 
            break;

        case 'width':
        default: 
          chosenScale = widthScale;
          reason = 'width-fit';
      }

      const target = Math.min(maxScale, Math.max(minScale, chosenScale));
      
      setScale(prev => 
        Math.abs(prev - target) < EPS 
          ? prev 
          : target);
      
      containerEl.scrollLeft = 0;
      containerEl.scrollTop = 0;
      autoFitAppliedRef.current = true;
      
      onApplied?.(target, { mode, reason });
      
      return true;
    };

    const loop = () => {
      if (autoFitAppliedRef.current) return;
      if (tryFit()) return;
      if (attempt++ < retries) rafId = requestAnimationFrame(loop);
    };

    loop();
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [
    autoFit?.svgContent, 
    autoFit?.mode, 
    autoFit?.retries, 
    autoFit?.onApplied, 
    scale, 
    minScale, 
    maxScale, 
    autoFitTrigger
  ]);

  const resetView = () => {
    const targetBase = autoFit ? 1 : initialScale;
    setScale(targetBase);
    if (containerRef.current) { (containerRef.current as HTMLElement).scrollLeft = 0; (containerRef.current as HTMLElement).scrollTop = 0; }
    if (autoFit) {
      autoFitAppliedRef.current = false;
      setAutoFitTrigger(t => t + 1);
    }
  };

  return { scale, isAltPressed, setScale, resetView };
};

export interface ZoomHandlers {
  onContainerMouseDown: (e: React.MouseEvent) => void;
  onContainerMouseUp: () => void;
}

export const createZoomHandlers = (_api: UseZoomResult): ZoomHandlers => ({
  onContainerMouseDown: (_e) => {},
  onContainerMouseUp: () => {}
});
