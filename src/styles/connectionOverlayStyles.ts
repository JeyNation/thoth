import type { CSSProperties } from 'react';

// Container svg style
export const SVG_CONTAINER_STYLE: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 4,
};

// Colors / stroke styles
export const PATH_STROKE_COLOR = '#2e7d32';
export const PATH_STROKE_WIDTH = 2;
export const PATH_DASHARRAY = '6 4';

// Icon styles
export const CLEAR_ICON_STYLE: CSSProperties = {
  pointerEvents: 'auto',
  cursor: 'pointer',
};
export const CLEAR_ICON_FILL = '#fff';
export const CLEAR_ICON_STROKE = '#2e7d32';

// Sizes
export const MARKER_RADIUS = 6;
export const ARROW_SIZE = 14;
export const ARROW_HALF = 6;
export const GAP = 8;
export const ICON_R = 5;
export const ICON_STROKE = 1.5;

// Curve constant
export const KAPPA = 0.5522847498;

export default {
  SVG_CONTAINER_STYLE,
  PATH_STROKE_COLOR,
  PATH_STROKE_WIDTH,
  PATH_DASHARRAY,
  CLEAR_ICON_STYLE,
  CLEAR_ICON_FILL,
  CLEAR_ICON_STROKE,
  MARKER_RADIUS,
  ARROW_SIZE,
  ARROW_HALF,
  GAP,
  ICON_R,
  ICON_STROKE,
  KAPPA,
};
