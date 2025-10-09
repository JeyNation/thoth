import React from 'react';

export interface ClearIconProps { size?: number; stroke?: string; strokeWidth?: number; className?: string; title?: string; }
const ClearIcon: React.FC<ClearIconProps> = ({ size = 16, stroke = 'currentColor', strokeWidth = 2, className = '', title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : 'presentation'}
  >
    {title && <title>{title}</title>}
    <circle cx="10" cy="10" r="9" />
    <path d="M6 6l8 8M14 6l-8 8" />
  </svg>
);

export default ClearIcon;