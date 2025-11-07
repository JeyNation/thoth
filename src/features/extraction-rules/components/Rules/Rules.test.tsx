import { describe, it, expect } from 'vitest';

import Rules from './Rules';

describe('Rules scaffold', () => {
  it('exports a component', () => {
    expect(typeof Rules).toBe('function');
  });
});
