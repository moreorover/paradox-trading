import { describe, expect, it } from 'vitest';
import { getColorCode } from '../src/utils/getColor';

describe('getColorCode', () => {
  it('getColorByNumber returns blue for 0', () => {
    expect(getColorCode(0)).toBe('#0000ff');
  });

  it('getColorByNumber returns red for 100', () => {
    expect(getColorCode(100)).toBe('#ff0000');
  });
});
