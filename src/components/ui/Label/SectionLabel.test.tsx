import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestRoot } from '../../../test/utils/createTestRoot';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel', () => {
  let rootHelpers: ReturnType<typeof createTestRoot>;

  beforeEach(() => {
    rootHelpers = createTestRoot();
  });

  afterEach(() => {
    rootHelpers.cleanup();
  });

  it('renders children text', () => {
    rootHelpers.render(<SectionLabel>My Section</SectionLabel>);
    const el = rootHelpers.container.querySelector('p, span, div');
    expect(el).toBeTruthy();
    expect(el?.textContent).toBe('My Section');
  });

  it('forwards className to the root element', () => {
    rootHelpers.render(<SectionLabel className="my-section">Label</SectionLabel>);
    expect(rootHelpers.container.querySelector('.my-section')).toBeTruthy();
  });
});
