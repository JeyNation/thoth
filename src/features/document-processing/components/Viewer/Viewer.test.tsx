import { describe, it, expect } from 'vitest';

import Viewer from './Viewer';

describe('Viewer component scaffold', () => {
  it('exports a component', () => {
    expect(typeof Viewer).toBe('function');
  });
});
