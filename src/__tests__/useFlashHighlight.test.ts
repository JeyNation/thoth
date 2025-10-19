import { describe, expect, it } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import React from 'react';
import useFlashHighlight from '../hooks/useFlashHighlight';

describe('useFlashHighlight', () => {
  it('transitions strong -> fade -> clear based on timing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    let api: ReturnType<typeof useFlashHighlight> | null = null;
    function Test() {
      api = useFlashHighlight({ strongMs: 10, fadeMs: 20 });
      return null;
    }

    await act(async () => {
      root.render(React.createElement(Test));
    });

    expect(api).toBeTruthy();
    // Immediately after flash, should be strong
    act(() => {
      api!.flashField('a');
    });
    expect(api!.getStage('a')).toBe('strong');

    // Wait > strongMs
    await act(async () => {
      await new Promise((r) => setTimeout(r, 15));
    });
    expect(api!.getStage('a')).toBe('fade');

    // Wait > strongMs + fadeMs
    await act(async () => {
      await new Promise((r) => setTimeout(r, 25));
    });
    expect(api!.getStage('a')).toBeUndefined();

    // Cleanup
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
