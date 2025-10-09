'use client';

import React, { useState, useCallback } from 'react';

type HTMLElementTag = 'div' | 'span' | 'th' | 'td' | 'li' | 'ul' | 'section' | 'header' | 'footer' | 'main' | 'aside' | 'nav';

export interface DropZoneProps {
  as?: HTMLElementTag;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
  baseStyle?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  className?: string;
  title?: string;
  role?: string;
  // Optional: allow passing through custom dragOver handler in addition to internal highlight logic
  onDragOverExtra?: (e: React.DragEvent) => void;
}

/** Generic drop target with internal hover highlight state */
const DropZone: React.FC<DropZoneProps> = ({
  as = 'div',
  onDrop,
  children,
  baseStyle,
  activeStyle,
  className,
  title,
  role,
  onDragOverExtra
}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    if (!active) setActive(true);
    if (onDragOverExtra) onDragOverExtra(e);
  }, [active, onDragOverExtra]);

  const handleDragLeave = useCallback(() => {
    if (active) setActive(false);
  }, [active]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    setActive(false);
    onDrop(e);
  }, [onDrop]);

  const mergedStyle: React.CSSProperties = active
    ? { ...(baseStyle || {}), ...(activeStyle || {}) }
    : (baseStyle || {});

  return React.createElement(
    as,
    {
      className,
      style: mergedStyle,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      title,
      role,
    },
    children
  );
};

export default DropZone;
