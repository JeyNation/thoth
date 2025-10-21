"use client";

import React from 'react';

export type OverlayRect = { left: number; top: number; right: number; bottom: number };
export type ClampSides = { left: boolean; right: boolean; top: boolean; bottom: boolean };
export type OverlayConnection = {
  a: OverlayRect;
  b: OverlayRect;
  // Optional identifiers to allow actions (e.g., unlink) from the overlay
  fieldId?: string; // the form field ID linked in this connection
  boxId?: string;   // the bounding box ID linked in this connection
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

// Presentational overlay: draws curved connections; when a view-side endpoint is clamped,
// force the curve's tangent at that endpoint to point inward according to the clamped edge(s).
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

  const MARKER_RADIUS = 6;
  const ARROW_SIZE = 14; // length from base to tip
  const ARROW_HALF = 6;  // half height of base
  const GAP = 8; // gap between box edge and path endpoints
  const KAPPA = 0.5522847498; // circle approximation constant

  return (
    <svg width="100%" height="100%" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 99999 }}>
      {connections.map((conn, i) => {
        // Build endpoints then normalize so start = left, end = right
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

        // Force tangents on clamped endpoints based on start/end rules
        // Start (left): x => +1; top => +1y; bottom => -1y
        // End (right): x => +1; top => -1y; bottom => +1y
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
        const tStart = start.clamped ? (forcedStartTangent(startOut as any, start.clampSides) || { x: na.nx, y: na.ny }) : { x: na.nx, y: na.ny };
        const tEnd = end.clamped ? (forcedEndTangent(endOut as any, end.clampSides) || { x: -nb.nx, y: -nb.ny }) : { x: -nb.nx, y: -nb.ny };

        const mixedOrientation = (Math.abs(na.nx) > 0) !== (Math.abs(nb.nx) > 0);

        // Add a small gap so the line/marker doesn't touch the box edge
  const pStart = { x: pa.x + tStart.x * GAP, y: pa.y + tStart.y * GAP };
  const pEnd = { x: pb.x - tEnd.x * GAP, y: pb.y - tEnd.y * GAP };

  // Map endpoint positions to their logical sides (viewer/form)
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

        // If the segment is very short, use a simple, gentle curve
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

        const Arrow = ({ x, y, dir }: { x: number; y: number; dir: { x: number; y: number } }) => {
          const len = Math.hypot(dir.x, dir.y) || 1;
          const ux = dir.x / len; const uy = dir.y / len;
          const angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
          const cx = x + ux * (2 * ARROW_SIZE / 3);
          const cy = y + uy * (2 * ARROW_SIZE / 3);
          const points = `0,0 ${-ARROW_SIZE},${ARROW_HALF} ${-ARROW_SIZE},${-ARROW_HALF}`;
          return <polygon points={points} fill="#2e7d32" transform={`translate(${cx},${cy}) rotate(${angle})`} />;
        };

        // Clear icon component and placement
        const ICON_R = 5; const ICON_STROKE = 1.5;
        const stopAll = (e: any) => {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          const ne = e?.nativeEvent as any;
          if (ne && typeof ne.stopImmediatePropagation === 'function') ne.stopImmediatePropagation();
        };
        const ClearIcon = ({ x, y }: { x: number; y: number }) => (
          <g
            transform={`translate(${x},${y})`}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            onMouseDown={(e) => { stopAll(e); }}
            onClick={(e) => { stopAll(e); onCenterIconClick && onCenterIconClick(conn, i); }}
          >
            <circle r={ICON_R} fill="#fff" stroke="#2e7d32" strokeWidth={ICON_STROKE} />
            <line x1={-3} y1={-3} x2={3} y2={3} stroke="#2e7d32" strokeWidth={ICON_STROKE} strokeLinecap="round" />
            <line x1={-3} y1={3} x2={3} y2={-3} stroke="#2e7d32" strokeWidth={ICON_STROKE} strokeLinecap="round" />
          </g>
        );

  // Determine focused and linked sides
  const pFocused = focusSource === 'viewer' ? pView : focusSource === 'form' ? pForm : null;
  const pLinked = focusSource === 'viewer' ? pForm : focusSource === 'form' ? pView : null;
  // Clear icon sits on the linked side per UX rule
  const clearX = pLinked ? pLinked.x : pStart.x;
  const clearY = pLinked ? pLinked.y : pStart.y;

        return (
          <g key={i}>
            <path d={d} stroke="#2e7d32" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="6 4" />
            {pLinked && <ClearIcon x={clearX} y={clearY} />}
            {/* Linked side: solid circle; Focused side: no circle or x-circle */}
            {pLinked && <circle cx={pLinked.x} cy={pLinked.y} r={MARKER_RADIUS} fill="#2e7d32" />}
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionOverlay;
