"use client";

import React from 'react';

export type OverlayRect = { left: number; top: number; right: number; bottom: number };
export type ClampSides = { left: boolean; right: boolean; top: boolean; bottom: boolean };
export type OverlayConnection = {
  a: OverlayRect;
  b: OverlayRect;
  fieldId?: string;
  boxId?: string;
  aClamped?: boolean;
  bClamped?: boolean;
  aClampSides?: ClampSides;
  bClampSides?: ClampSides;
  aSide?: 'view' | 'form';
  bSide?: 'view' | 'form';
  aOut?: { left: boolean; right: boolean; top: boolean; bottom: boolean };
  bOut?: { left: boolean; right: boolean; top: boolean; bottom: boolean };
};
type Props = {
  connections: OverlayConnection[];
  onCenterIconClick?: (conn: OverlayConnection, index: number) => void;
  focusSource?: 'viewer' | 'form';
};

const ConnectionOverlay: React.FC<Props> = ({ connections, onCenterIconClick, focusSource }) => {
  const center = (r: OverlayRect) => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });
  const boundaryPointToward = (r: OverlayRect, toward: { x: number; y: number }) => {
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const dx = toward.x - cx;
    const dy = toward.y - cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx >= 0) return { x: r.right, y: cy };
      return { x: r.left, y: cy };
    } else {
      if (dy >= 0) return { x: cx, y: r.bottom };
      return { x: cx, y: r.top };
    }
  };

  const {
    SVG_CONTAINER_STYLE,
    PATH_STROKE_COLOR,
    PATH_STROKE_WIDTH,
    PATH_DASHARRAY,
    CLEAR_ICON_STYLE,
    CLEAR_ICON_FILL,
    CLEAR_ICON_STROKE,
    MARKER_RADIUS,
    GAP,
    ICON_R,
    ICON_STROKE,
    KAPPA,
  } = require('../styles/connectionOverlayStyles');

  return (
    <svg width="100%" height="100%" style={SVG_CONTAINER_STYLE}>
      {connections.map((conn, i) => {
        const epA = { rect: conn.a, center: center(conn.a), clamped: !!conn.aClamped, clampSides: conn.aClampSides, side: conn.aSide };
        const epB = { rect: conn.b, center: center(conn.b), clamped: !!conn.bClamped, clampSides: conn.bClampSides, side: conn.bSide };
        const [start, end] = epA.center.x <= epB.center.x ? [epA, epB] : [epB, epA];

        const pa = boundaryPointToward(start.rect, end.center);
        const pb = boundaryPointToward(end.rect, start.center);
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.hypot(dx, dy) || 1;

        const dStart = { x: dx / dist, y: dy / dist };
        const dEnd = { x: -dx / dist, y: -dy / dist };

        const eps = 1.0;
        const chooseNormal = (r: OverlayRect, p: { x: number; y: number }, dir: { x: number; y: number }) => {
          const dl = Math.abs(p.x - r.left);
          const dr = Math.abs(r.right - p.x);
          const dt = Math.abs(p.y - r.top);
          const db = Math.abs(r.bottom - p.y);
          const m = Math.min(dl, dr, dt, db);
          const candidates: Array<{ nx: number; ny: number; d: number }> = [];
          if (dl - m < eps) candidates.push({ nx: -1, ny: 0, d: dl });
          if (dr - m < eps) candidates.push({ nx: 1, ny: 0, d: dr });
          if (dt - m < eps) candidates.push({ nx: 0, ny: -1, d: dt });
          if (db - m < eps) candidates.push({ nx: 0, ny: 1, d: db });
          let best = candidates[0] || { nx: 1, ny: 0, d: 0 };
          let bestDot = -Infinity;
          for (const c of candidates) {
            const dot = c.nx * dir.x + c.ny * dir.y;
            if (dot > bestDot) { bestDot = dot; best = c; }
          }
          return { nx: best.nx, ny: best.ny };
        };

        const na = chooseNormal(start.rect, pa, dStart);
        const nb = chooseNormal(end.rect, pb, dEnd);

        const controlLen = (n: { nx: number; ny: number }) => {
          const along = Math.abs(n.nx) > 0 ? Math.abs(dx) : Math.abs(dy);
          return Math.max(40, Math.min(200, along * 0.55 || dist * 0.35));
        };
        let la = controlLen(na);
        let lb = controlLen(nb);

        type OutFlags = { left: boolean; right: boolean; top: boolean; bottom: boolean };
        const forcedStartTangent = (out?: OutFlags, sides?: ClampSides): { x: number; y: number } | null => {
          const hx = out ? (out.left || out.right) : (sides ? (sides.left || sides.right) : false);
          const tx = hx ? 1 : 0; let ty = 0;
          if (out) ty = out.bottom ? -1 : (out.top ? 1 : 0);
          else if (sides) ty = sides.bottom ? -1 : (sides.top ? 1 : 0);
          if (tx === 0 && ty === 0) return null; return { x: tx, y: ty };
        };
        const forcedEndTangent = (out?: OutFlags, sides?: ClampSides): { x: number; y: number } | null => {
          const hx = out ? (out.left || out.right) : (sides ? (sides.left || sides.right) : false);
          const tx = hx ? 1 : 0; let ty = 0;
          if (out) ty = out.bottom ? 1 : (out.top ? -1 : 0);
          else if (sides) ty = sides.bottom ? 1 : (sides.top ? -1 : 0);
          if (tx === 0 && ty === 0) return null; return { x: tx, y: ty };
        };
        const startOut = start === epA ? conn.aOut : conn.bOut;
        const endOut = end === epA ? conn.aOut : conn.bOut;
        const tStart = start.clamped ? (forcedStartTangent(startOut as OutFlags, start.clampSides) || { x: na.nx, y: na.ny }) : { x: na.nx, y: na.ny };
        const tEnd = end.clamped ? (forcedEndTangent(endOut as OutFlags, end.clampSides) || { x: -nb.nx, y: -nb.ny }) : { x: -nb.nx, y: -nb.ny };

        const mixedOrientation = (Math.abs(na.nx) > 0) !== (Math.abs(nb.nx) > 0);

        const pStart = { x: pa.x + tStart.x * GAP, y: pa.y + tStart.y * GAP };
        const pEnd = { x: pb.x - tEnd.x * GAP, y: pb.y - tEnd.y * GAP };

        const isAStart = start === epA;
        const posA = isAStart ? pStart : pEnd;
        const posB = isAStart ? pEnd : pStart;
        let pView = posA;
        let pForm = posB;
        if (epA.side === 'view') pView = posA; else if (epB.side === 'view') pView = posB;
        if (epA.side === 'form') pForm = posA; else if (epB.side === 'form') pForm = posB;

        if (mixedOrientation) {
          const ddx = pEnd.x - pStart.x; const ddy = pEnd.y - pStart.y;
          const R = Math.min(Math.abs(ddx), Math.abs(ddy));
          const C = KAPPA * R; la = C; lb = C;
        }

        const segLen = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
        if (segLen < 80) {
          const SIMPLE_SHORT = Math.min(28, Math.max(12, segLen * 0.4));
          la = SIMPLE_SHORT; lb = SIMPLE_SHORT;
        }

        const c1x = pStart.x + tStart.x * la;
        const c1y = pStart.y + tStart.y * la;
        const c2x = pEnd.x - tEnd.x * lb;
        const c2y = pEnd.y - tEnd.y * lb;

        const d = `M ${pStart.x},${pStart.y} C ${c1x},${c1y} ${c2x},${c2y} ${pEnd.x},${pEnd.y}`;

        const stopAll = (e: React.MouseEvent<SVGGElement, MouseEvent>) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          const ne = e?.nativeEvent as MouseEvent | undefined;
          if (ne && typeof ne.stopImmediatePropagation === 'function') ne.stopImmediatePropagation();
        };
        const ClearIcon = ({ x, y }: { x: number; y: number }) => (
          <g
            transform={`translate(${x},${y})`}
            style={CLEAR_ICON_STYLE}
            onMouseDown={(e) => { stopAll(e); }}
            onClick={(e) => { stopAll(e); onCenterIconClick && onCenterIconClick(conn, i); }}
          >
            <circle r={ICON_R} fill={CLEAR_ICON_FILL} stroke={CLEAR_ICON_STROKE} strokeWidth={ICON_STROKE} />
          </g>
        );

        const pFocused = focusSource === 'viewer' ? pView : focusSource === 'form' ? pForm : null;
        const pLinked = focusSource === 'viewer' ? pForm : focusSource === 'form' ? pView : null;
        
        const clearX = pLinked ? pLinked.x : pStart.x;
        const clearY = pLinked ? pLinked.y : pStart.y;

        return (
          <g key={i}>
            <path d={d} stroke={PATH_STROKE_COLOR} strokeWidth={PATH_STROKE_WIDTH} fill="none" strokeLinecap="round" strokeDasharray={PATH_DASHARRAY} />
            {pLinked && <ClearIcon x={clearX} y={clearY} />}
            {pLinked && <circle cx={pLinked.x} cy={pLinked.y} r={MARKER_RADIUS} fill="#2e7d32" />}
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionOverlay;
