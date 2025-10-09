import React from 'react';

export interface ZoomOutIconProps { size?: number; stroke?: string; strokeWidth?: number; className?: string; title?: string; }
const ZoomOutIcon: React.FC<ZoomOutIconProps> = ({ size=18, stroke='currentColor', strokeWidth=2, className='', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title?undefined:true} role={title? 'img':'presentation'}>
    {title && <title>{title}</title>}
    <circle cx="11" cy="11" r="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
export default ZoomOutIcon;
