import React from 'react';

export interface ViewerProps {
  className?: string;
}

export default function Viewer(_props: ViewerProps) {
  return <div data-testid="viewer">Viewer</div>;
}
