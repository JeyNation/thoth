import React from 'react';

export interface ResetIconProps { size?: number; stroke?: string; strokeWidth?: number; className?: string; title?: string; }
const ResetIcon: React.FC<ResetIconProps> = ({ size=18, stroke='currentColor', strokeWidth=2, className='', title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title?undefined:true} role={title? 'img':'presentation'}>
    {title && <title>{title}</title>}
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-5h-3" />
  </svg>
);
export default ResetIcon;
