import React from 'react';
export interface CloseIconProps { size?: number; stroke?: string; strokeWidth?: number; className?: string; title?: string; }
const CloseIcon: React.FC<CloseIconProps> = ({ size=12, stroke='currentColor', strokeWidth=2, className='', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title?undefined:true} role={title? 'img':'presentation'}>
    {title && <title>{title}</title>}
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
export default CloseIcon;
