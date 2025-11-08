import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import IconButton from './IconButton';
import { createTestRoot } from '../../../test/utils/createTestRoot';

describe('IconButton', () => {
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
    rootHelpers.render(<IconButton ariaLabel="my-btn">X</IconButton>);

    const btn = container.querySelector('button') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.tagName.toLowerCase()).toBe('button');
  });

  it('forwards className, aria-label and title', () => {
    rootHelpers.render(
      <IconButton ariaLabel="my-btn" title="hover" className="foo">
        X
      </IconButton>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.classList.contains('foo')).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('my-btn');
    expect(btn.getAttribute('title')).toBe('hover');
  });

  it('calls onClick when clicked and does not call when disabled', () => {
    const handleClick = vi.fn();

    // clickable
    rootHelpers.render(
      <IconButton ariaLabel="clickable" onClick={handleClick}>
        C
      </IconButton>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleClick).toHaveBeenCalled();

    // disabled should not call
    rootHelpers.render(
      <IconButton ariaLabel="disabled" onClick={handleClick} disabled>
        {' '}
        D{' '}
      </IconButton>,
    );

    const disabledBtn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      disabledBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // handler was called once (from first click) and not again from disabled click
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the native button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    rootHelpers.render(
      <IconButton ariaLabel="ref" ref={ref}>
        R
      </IconButton>,
    );

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(ref.current).toBe(btn);
  });
});
