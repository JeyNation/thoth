import React from 'react';
import { act } from 'react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import TextButton from './TextButton';
import { createTestRoot } from '../../../test/utils/createTestRoot';

describe('TextButton', () => {
  let container: HTMLDivElement;
  let rootHelpers: ReturnType<typeof createTestRoot>;

  beforeEach(() => {
    rootHelpers = createTestRoot();
    container = rootHelpers.container;
  });

  afterEach(() => {
    rootHelpers.cleanup();
    vi.clearAllMocks();
  });

  it('renders a button element', () => {
    rootHelpers.render(<TextButton ariaLabel="tb">Link</TextButton>);

    const btn = container.querySelector('button') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.tagName.toLowerCase()).toBe('button');
  });

  it('forwards className and aria-label', () => {
    rootHelpers.render(
      <TextButton ariaLabel="my-text" className="txt">
        T
      </TextButton>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.classList.contains('txt')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('my-text');
  });

  it('calls onClick and forwards ref', () => {
    const handleClick = vi.fn();
    const ref = React.createRef<HTMLButtonElement>();

    rootHelpers.render(
      <TextButton ariaLabel="click" onClick={handleClick} ref={ref}>
        C
      </TextButton>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleClick).toHaveBeenCalled();
    expect(ref.current).toBe(btn);
  });
});
