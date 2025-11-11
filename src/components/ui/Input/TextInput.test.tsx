import React from 'react';
import { act } from 'react';

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import TextInput from './TextInput';
import { createTestRoot } from '../../../test/utils/createTestRoot';

describe('TextInput', () => {
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

  it('renders an input element', () => {
    rootHelpers.render(<TextInput label="Name" id="name" />);

    const input = container.querySelector('input') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(input!.tagName.toLowerCase()).toBe('input');
  });

  it('forwards value and calls onChange when typing', () => {
    const handleChange = vi.fn();
    rootHelpers.render(
      <TextInput label="Email" id="email" value="a@b.com" onChange={handleChange} />,
    );

    const input = container.querySelector('input') as HTMLInputElement;
    act(() => {
      // use the native value setter so React's internal value tracker is updated (matches testing-library)
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!;
      nativeInputValueSetter.call(input, 'x@x.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(handleChange).toHaveBeenCalled();
  });

  it('forwards className to the root element', () => {
    rootHelpers.render(<TextInput label="City" id="city" className="my-text" />);

    expect(container.querySelector('.my-text')).toBeTruthy();
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('passes inputProps through to the native input', () => {
    rootHelpers.render(
      <TextInput
        label="Phone"
        id="phone"
        inputProps={
          { 'data-qa': 'phone-input' } as React.InputHTMLAttributes<
            HTMLInputElement | HTMLTextAreaElement
          > &
            Record<string, unknown>
        }
      />,
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('data-qa')).toBe('phone-input');
  });

  it('forwards ref to the native input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    rootHelpers.render(<TextInput label="RefTest" id="reftest" ref={ref} />);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(ref.current).toBe(input);
  });
});
