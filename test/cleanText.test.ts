import { describe, expect, it } from 'vitest';
import { cleanText } from '../src/utils/cleanText';

describe('cleanText', () => {
  it('should replace HTML encoded characters with their corresponding characters', () => {
    const input = 'This is an example &#38; text.';
    const expectedOutput = 'This is an example & text.';
    expect(cleanText(input)).toEqual(expectedOutput);
  });

  it('should handle multiple occurrences of HTML encoded characters', () => {
    const input = '&#8220;Hello,&#8221; she said, &#8220;how are you?&#8221;';
    const expectedOutput = '“Hello,” she said, “how are you?”';
    expect(cleanText(input)).toEqual(expectedOutput);
  });

  it('should not modify text without HTML encoded characters', () => {
    const input = 'This is a plain text.';
    expect(cleanText(input)).toEqual(input);
  });

  it('should handle edge cases with empty string', () => {
    const input = '';
    expect(cleanText(input)).toEqual(input);
  });
});
