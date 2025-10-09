import React from 'react';

export interface EyeOffIconProps {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

const EyeOffIcon: React.FC<EyeOffIconProps> = ({
  size = 17,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = '',
  title
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
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
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export default EyeOffIcon;
