import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

export type TestRoot = {
  container: HTMLDivElement;
  root: Root;
  render: (el: React.ReactElement) => void;
  cleanup: () => void;
};

export function createTestRoot(): TestRoot {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  return {
    container,
    root,
    render(el: React.ReactElement) {
      act(() => {
        root.render(el);
      });
    },
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}
