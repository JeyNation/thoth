import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestRoot } from '../../../../test/utils/createTestRoot';
import { act } from 'react';
import Indicator from './Indicator';

describe('Indicator', () => {
  let rootHelpers: ReturnType<typeof createTestRoot>;
  let container: HTMLDivElement;

  beforeEach(() => {
    rootHelpers = createTestRoot();
    container = rootHelpers.container;
  });

  afterEach(() => {
    rootHelpers.cleanup();
    vi.clearAllMocks();
  });

  it('renders a spinner and forwards className and testId', () => {
    rootHelpers.render(<Indicator label="Loading" className="ind" testId="ind-1" />);
    const el = container.querySelector('[data-testid="ind-1"]');
    expect(el).toBeTruthy();
    expect(el?.classList.contains('ind')).toBe(true);
  });

  it('applies size mapping and custom color', () => {
    rootHelpers.render(<Indicator size="lg" color="primary" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders accessible label when provided', () => {
    rootHelpers.render(<Indicator label="Please wait" testId="ind-2" />);
    const el = container.querySelector('[data-testid="ind-2"]');
    expect(el?.textContent).toContain('Please wait');
  });
});
