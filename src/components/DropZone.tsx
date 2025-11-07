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
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
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
  onDragOver,
  onDragEnter,
  onDragLeave,
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
    if (onDragEnter) onDragEnter(e);
  }, [active, onDragEnter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) onDragOver(e);
  }, [onDragOver]);

  const handleDragLeave = useCallback((e?: React.DragEvent) => {
    if (hoverDepthRef.current > 0) {
      hoverDepthRef.current -= 1;
    }
    if (hoverDepthRef.current === 0) {
      setActive(false);
      if (onDragLeave && e) onDragLeave(e);
    }
  }, [onDragLeave]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    clearActiveState();
    onDrop(e);
  }, [clearActiveState, onDrop]);

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
        const { background, backgroundColor, backgroundImage, ...restActive } = (activeStyle || {} as React.CSSProperties);

        const expandBorder = (s?: React.CSSProperties) => {
          const out: Partial<Record<'borderWidth' | 'borderStyle' | 'borderColor', string>> = {};
          if (!s) return out;
          const borderVal = typeof s.border === 'string' ? s.border : undefined;
          if (borderVal) {
            const m = borderVal.trim().match(/^([0-9.]+[a-z%]*)\s+([a-z]+)\s+(.*)$/i);
            if (m) {
              out.borderWidth = m[1];
              out.borderStyle = m[2];
              out.borderColor = m[3];
            }
          }
          const bw = s.borderWidth;
          if (bw !== undefined && bw !== null) out.borderWidth = String(bw);
          const bs = s.borderStyle;
          if (bs !== undefined && bs !== null) out.borderStyle = String(bs);
          const bc = s.borderColor;
          if (bc !== undefined && bc !== null) out.borderColor = String(bc);
          return out;
        };

        const base = { ...(baseStyle || {}) } as React.CSSProperties;
        const activeParts = expandBorder(restActive as React.CSSProperties);
        const baseParts = expandBorder(baseStyle as React.CSSProperties);

        const merged = { ...(base as Record<string, unknown>), ...(restActive as Record<string, unknown>) } as Record<string, unknown>;

        delete merged.border;
        delete merged.borderStyle;
        delete merged.borderWidth;
        delete merged.borderColor;

        const finalBorder = { ...baseParts, ...activeParts };
        if (finalBorder.borderWidth) merged.borderWidth = finalBorder.borderWidth;
        if (finalBorder.borderStyle) merged.borderStyle = finalBorder.borderStyle;
        if (finalBorder.borderColor) merged.borderColor = finalBorder.borderColor;

        return merged as React.CSSProperties;
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
      onDrop: handleDrop,
    },
    children
  );
};

export default DropZone;
