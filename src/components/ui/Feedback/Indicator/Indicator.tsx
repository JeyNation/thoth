import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

export type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg' | number;
export type IndicatorVariant = 'spinner' | 'dots' | 'bar';
export type IndicatorColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export interface IndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: IndicatorSize;
  variant?: IndicatorVariant;
  color?: IndicatorColor;
  label?: string; // accessible label
  ariaLive?: 'polite' | 'assertive' | 'off';
  inline?: boolean;
  testId?: string;
}

function mapSize(size?: IndicatorSize) {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'xs':
      return 12;
    case 'sm':
      return 18;
    case 'lg':
      return 36;
    case 'md':
    default:
      return 24;
  }
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const Indicator = React.forwardRef<HTMLDivElement, IndicatorProps>(function Indicator(props, ref) {
  const {
    className,
    size = 'md',
    variant = 'spinner',
    color = 'inherit',
    label,
    ariaLive = 'polite',
    inline = false,
    testId,
    ...rest
  } = props;

  const computedSize = mapSize(size);

  const role = variant === 'bar' ? 'progressbar' : 'status';

  return (
    <div
      ref={ref}
      role={role}
      aria-live={ariaLive === 'off' ? undefined : ariaLive}
      className={`${inline ? 'inline-flex items-center' : 'flex items-center'} ${className ?? ''}`}
      data-testid={testId}
      {...rest}
    >
      {variant === 'spinner' && <CircularProgress size={computedSize} color={color as any} />}

      {/* Accessible label: visually hidden but announced by screen readers */}
      {label ? <span style={visuallyHiddenStyle}>{label}</span> : null}
    </div>
  );
});

export default Indicator;
export { Indicator };
