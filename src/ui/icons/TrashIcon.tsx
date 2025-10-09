import React from 'react';
export interface TrashIconProps { size?: number; stroke?: string; strokeWidth?: number; className?: string; title?: string; }
const TrashIcon: React.FC<TrashIconProps> = ({ size=16, stroke='currentColor', strokeWidth=2, className='', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title?undefined:true} role={title? 'img':'presentation'}>
    {title && <title>{title}</title>}
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
export default TrashIcon;
