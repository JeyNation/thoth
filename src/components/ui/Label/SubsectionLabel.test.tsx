import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestRoot } from '../../../test/utils/createTestRoot';
import { SubsectionLabel } from './SubsectionLabel';

describe('SubsectionLabel', () => {
  let rootHelpers: ReturnType<typeof createTestRoot>;

  beforeEach(() => {
    rootHelpers = createTestRoot();
  });

  afterEach(() => {
    rootHelpers.cleanup();
  });

  it('renders children text', () => {
    rootHelpers.render(<SubsectionLabel>My Subsection</SubsectionLabel>);
    const el = rootHelpers.container.querySelector('p, span, div');
    expect(el).toBeTruthy();
    expect(el?.textContent).toBe('My Subsection');
  });

  it('forwards className to the root element', () => {
    rootHelpers.render(<SubsectionLabel className="my-subsection">Label</SubsectionLabel>);
    expect(rootHelpers.container.querySelector('.my-subsection')).toBeTruthy();
  });
});
