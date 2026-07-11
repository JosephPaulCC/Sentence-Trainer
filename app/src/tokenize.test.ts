import { describe, it, expect } from 'vitest';
import { tokenize, isRtl } from './tokenize';

describe('tokenize', () => {
  it('splits on whitespace and keeps duplicate words as separate tokens', () => {
    const tokens = tokenize('the cat and the dog sat on the mat');
    expect(tokens).toEqual(['the', 'cat', 'and', 'the', 'dog', 'sat', 'on', 'the', 'mat']);
    expect(tokens.filter((t) => t === 'the')).toHaveLength(3);
  });

  it('never strips punctuation — it stays attached to the token', () => {
    const tokens = tokenize('है। है');
    expect(tokens).toEqual(['है।', 'है']);
    expect(tokens[0]).not.toBe(tokens[1]);
  });

  it('collapses extra internal and surrounding whitespace', () => {
    expect(tokenize('  मैं   स्कूल  जाता हूँ  ')).toEqual(['मैं', 'स्कूल', 'जाता', 'हूँ']);
  });

  it('treats a single-token sentence as a valid trivial puzzle', () => {
    expect(tokenize('Hello')).toEqual(['Hello']);
  });
});

describe('isRtl', () => {
  it('detects Urdu (Arabic-script) sentences as RTL', () => {
    expect(isRtl('دروازہ کھولو')).toBe(true);
  });

  it('detects Arabic sentences as RTL', () => {
    expect(isRtl('افتح الباب')).toBe(true);
  });

  it('does not treat Devanagari sentences as RTL', () => {
    expect(isRtl('मैं स्कूल जाता हूँ')).toBe(false);
  });

  it('does not treat plain Latin sentences as RTL', () => {
    expect(isRtl('the cat and the dog sat on the mat')).toBe(false);
  });
});
