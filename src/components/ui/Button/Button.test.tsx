import React from 'react';
import { act } from 'react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import Button from './Button';
import { createTestRoot } from '../../../test/utils/createTestRoot';

describe('Button', () => {
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
    rootHelpers.render(<Button ariaLabel="btn">Click</Button>);

    const btn = container.querySelector('button') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.tagName.toLowerCase()).toBe('button');
  });

  it('forwards className, aria-label and title', () => {
    rootHelpers.render(
      <Button ariaLabel="my-btn" title="hover" className="btn-class">
        X
      </Button>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.classList.contains('btn-class')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('my-btn');
    expect(btn.getAttribute('title')).toBe('hover');
  });

  it('calls onClick when clicked and does not call when disabled', () => {
    const handleClick = vi.fn();

    // clickable
    rootHelpers.render(
      <Button ariaLabel="clickable" onClick={handleClick}>
        C
      </Button>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleClick).toHaveBeenCalled();

    // disabled should not call
    rootHelpers.render(
      <Button ariaLabel="disabled" onClick={handleClick} disabled>
        {' '}
        D{' '}
      </Button>,
    );

    const disabledBtn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      disabledBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the native button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    rootHelpers.render(
      <Button ariaLabel="ref" ref={ref}>
        R
      </Button>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(ref.current).toBe(btn);
  });
});
