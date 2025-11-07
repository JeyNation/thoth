import { describe, it, expect } from 'vitest';

import Workspace from './Workspace';

describe('Workspace scaffold', () => {
  it('exports a component', () => {
    expect(typeof Workspace).toBe('function');
  });
});
