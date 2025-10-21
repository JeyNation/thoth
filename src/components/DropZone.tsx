'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

type HTMLElementTag = 'div' | 'span' | 'th' | 'td' | 'li' | 'ul' | 'section' | 'header' | 'footer' | 'main' | 'aside' | 'nav';

export interface DropZoneProps {
  as?: HTMLElementTag;
  children: React.ReactNode;
  baseStyle?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  className?: string;
  title?: string;
  role?: string;
  externallyActive?: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOverExtra?: (e: React.DragEvent) => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  as = 'div',
  children,
  baseStyle,
  activeStyle,
  className,
  title,
  role,
  externallyActive = false,
  onDrop,
  onDragOverExtra
}) => {
  const [active, setActive] = useState(false);
  const hoverDepthRef = useRef(0);

  const clearActiveState = useCallback(() => {
    hoverDepthRef.current = 0;
    setActive(false);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    hoverDepthRef.current += 1;
    if (!active) setActive(true);
  }, [active]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOverExtra) onDragOverExtra(e);
  }, [onDragOverExtra]);

  const handleDragLeave = useCallback(() => {
    if (hoverDepthRef.current > 0) {
      hoverDepthRef.current -= 1;
    }
    if (hoverDepthRef.current === 0) {
      setActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    clearActiveState();
    onDrop(e);
  }, [clearActiveState, onDrop]);

  const handleDropCapture = useCallback(() => {
    if (active) clearActiveState();
  }, [active, clearActiveState]);

  useEffect(() => {
    const handleGlobalDrop = () => clearActiveState();

    window.addEventListener('dragend', handleGlobalDrop);
    window.addEventListener('drop', handleGlobalDrop, true);

    return () => {
      window.removeEventListener('dragend', handleGlobalDrop);
      window.removeEventListener('drop', handleGlobalDrop, true);
    };
  }, [clearActiveState]);

  const mergedStyle: React.CSSProperties = (active || externallyActive)
    ? (() => {
        // Prevent any activeStyle from changing background appearance.
        const { background, backgroundColor, backgroundImage, ...restActive } = (activeStyle || {});
        return { ...(baseStyle || {}), ...restActive };
      })()
    : (baseStyle || {});

  return React.createElement(
    as,
    {
      className,
      role,
      style: mergedStyle,
      title,
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDropCapture: handleDropCapture,
      onDrop: handleDrop,
    },
    children
  );
};

export default DropZone;
