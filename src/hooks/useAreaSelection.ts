import { useState, useCallback } from 'react';

export interface AreaSelectionState {
  isAreaSelecting: boolean;
  showSelectionRect: boolean;
  selectionStart: { x: number; y: number } | null;
  selectionEnd: { x: number; y: number } | null;
}

export interface UseAreaSelectionResult extends AreaSelectionState {
  beginSelection: (point: { x: number; y: number }) => void;
  updateSelection: (point: { x: number; y: number }) => void;
  finalizeSelection: () => void;
  cancelSelection: () => void;
  getSelectionRectStyle: () => React.CSSProperties;
}

export const useAreaSelection = (): UseAreaSelectionResult => {
  const [isAreaSelecting, setIsAreaSelecting] = useState(false);
  const [showSelectionRect, setShowSelectionRect] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  const beginSelection = useCallback((point: { x: number; y: number }) => {
    setIsAreaSelecting(true);
    setSelectionStart(point);
    setSelectionEnd(point);
    setShowSelectionRect(true);
  }, []);

  const updateSelection = useCallback((point: { x: number; y: number }) => {
    setSelectionEnd(point);
  }, []);

  const finalizeSelection = useCallback(() => {
    setIsAreaSelecting(false);
  }, []);

  const cancelSelection = useCallback(() => {
    setIsAreaSelecting(false);
    setShowSelectionRect(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  const getSelectionRectStyle = useCallback((): React.CSSProperties => {
    if (!showSelectionRect || !selectionStart || !selectionEnd) 
      return { display: 'none' };
   
    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    return { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` };
  }, [showSelectionRect, selectionStart, selectionEnd]);

  return { 
    isAreaSelecting, 
    showSelectionRect, 
    selectionStart, 
    selectionEnd, 
    beginSelection, 
    updateSelection, 
    finalizeSelection, 
    cancelSelection, 
    getSelectionRectStyle 
  };
};
