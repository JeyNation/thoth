import { useRef, useState, useEffect } from 'react';

export interface UsePanOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  activationKey?: string;           // default: 'Space'
  disabled?: boolean;               // disable all behavior
  onPan?: (pos: { x: number; y: number }) => void; // callback when position changes
}

export interface UsePanResult {
  isDragging: boolean;
  isKeyActive: boolean; // whether activation key held
  position: { x: number; y: number };
  beginPanAt: (clientX: number, clientY: number) => void;
  resetPan: () => void;
  cancelPan: () => void;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setIsKeyActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export const usePan = (opts: UsePanOptions): UsePanResult => {
  const { containerRef, activationKey = 'Space', disabled = false, onPan } = opts;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyActive, setIsKeyActive] = useState(false);

  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  
  useEffect(() => {
    if (disabled) return;
    const isEditableActive = () => {
      const el = (typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null);
      if (!el) return false;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
      // In case the active element is a wrapper, detect nearest contenteditable
      return !!el.closest('[contenteditable="true"]');
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === activationKey && !isKeyActive) {
        // Do not hijack Space while typing in an editable field
        if (isEditableActive()) return;
        e.preventDefault();
        setIsKeyActive(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === activationKey) {
        setIsKeyActive(false);
        setIsDragging(false);
      }
    };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up); 
    };
  }, [activationKey, isKeyActive, disabled]);

  useEffect(() => {
    if (disabled) return;
    const move = (e: MouseEvent) => {
      if (isDragging && containerRef.current && isKeyActive && panStartRef.current) {
        const { x, y, scrollLeft, scrollTop } = panStartRef.current;
        const dx = e.clientX - x;
        const dy = e.clientY - y;
        containerRef.current.scrollLeft = scrollLeft - dx;
        containerRef.current.scrollTop = scrollTop - dy;
        const next = { x: -containerRef.current.scrollLeft, y: -containerRef.current.scrollTop };
        setPosition(next);
        onPan?.(next);
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [isDragging, isKeyActive, disabled, onPan, containerRef]);

  const beginPanAt = (clientX: number, clientY: number) => {
    if (!containerRef.current || disabled) return;
    panStartRef.current = {
      x: clientX,
      y: clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    };
    setIsDragging(true);
  };

  const resetPan = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };
  const cancelPan = () => setIsDragging(false);

  return { 
    isDragging,
    isKeyActive,
    position,
    beginPanAt,
    resetPan,
    cancelPan,
    setIsDragging,
    setIsKeyActive
  };
};

export interface PanHandlers {
  onContainerMouseDown: (e: React.MouseEvent) => void;
  onContainerMouseUp: () => void;
}

export const createPanHandlers = (api: UsePanResult): PanHandlers => ({
  onContainerMouseDown: (e) => { if (api.isKeyActive) api.beginPanAt(e.clientX, e.clientY); },
  onContainerMouseUp: () => api.cancelPan()
});
