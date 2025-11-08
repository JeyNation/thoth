import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestRoot } from '../../../../test/utils/createTestRoot';
import EmptyDataIndicator from './EmptyDataIndicator';

describe('EmptyDataIndicator', () => {
  let rootHelpers = createTestRoot();

  beforeEach(() => {
    rootHelpers = createTestRoot();
  });

  afterEach(() => {
    rootHelpers.cleanup();
  });

  it('renders title and description', () => {
    rootHelpers.render(
      <EmptyDataIndicator title="No items" description="There are no items to show" />,
    );

    const container = rootHelpers.container;
    expect(container.textContent).toContain('No items');
    expect(container.textContent).toContain('There are no items to show');
  });

  it('renders icon and action when provided', () => {
    const action = <button data-testid="action">Create</button>;
    const icon = <svg data-testid="icon" />;

    rootHelpers.render(<EmptyDataIndicator title="Empty" icon={icon} action={action} />);

    const container = rootHelpers.container;
    expect(container.querySelector('[data-testid="icon"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="action"]')).toBeTruthy();
  });

  it('applies role and heading level', () => {
    rootHelpers.render(<EmptyDataIndicator title="Heading" role="region" headingLevel="h4" />);

    const container = rootHelpers.container;
    expect(container.querySelector('[role="region"]')).toBeTruthy();
    expect(container.querySelector('h4')).toBeTruthy();
  });
});
