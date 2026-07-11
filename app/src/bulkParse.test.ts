import { describe, it, expect } from 'vitest';
import { parseBulk } from './bulkParse';

describe('parseBulk', () => {
  it('parses a single segment with translation and transliteration in either order', () => {
    const a = parseBulk('मैं स्कूल जाता हूँ {I go to school} [main school jaata hoon]');
    expect(a.errors).toEqual([]);
    expect(a.valid).toEqual([{ sentence: 'मैं स्कूल जाता हूँ', translation: 'I go to school', transliteration: 'main school jaata hoon' }]);

    const b = parseBulk('मैं स्कूल जाता हूँ [main school jaata hoon] {I go to school}');
    expect(b.errors).toEqual([]);
    expect(b.valid).toEqual([{ sentence: 'मैं स्कूल जाता हूँ', translation: 'I go to school', transliteration: 'main school jaata hoon' }]);
  });

  it('splits multiple cards on § and trims/drops empty segments', () => {
    const input = 'मैं स्कूल जाता हूँ {I go to school} [main school jaata hoon] § دروازہ کھولو {Open the door} [darwaza kholo] §  § ';
    const { valid, errors } = parseBulk(input);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(2);
    expect(valid[1]).toEqual({ sentence: 'دروازہ کھولو', translation: 'Open the door', transliteration: 'darwaza kholo' });
  });

  it('never lets § survive into a saved field', () => {
    const { valid } = parseBulk('a §b§ c');
    for (const row of valid) {
      expect(row.sentence).not.toContain('§');
      expect(row.translation).not.toContain('§');
      expect(row.transliteration).not.toContain('§');
    }
  });

  it('treats a sentence with no translation/transliteration as valid with blank fields', () => {
    const { valid, errors } = parseBulk('This one has no translation');
    expect(errors).toEqual([]);
    expect(valid).toEqual([{ sentence: 'This one has no translation', translation: '', transliteration: '' }]);
  });

  it('saves {} or [] with nothing inside as a legitimately blank field', () => {
    const { valid, errors } = parseBulk('hello {} []');
    expect(errors).toEqual([]);
    expect(valid).toEqual([{ sentence: 'hello', translation: '', transliteration: '' }]);
  });

  it('collapses internal whitespace/newlines in the sentence to single spaces', () => {
    const { valid } = parseBulk('line one\nline   two {t}');
    expect(valid[0].sentence).toBe('line one line two');
  });

  it('errors on an unclosed brace or bracket', () => {
    const { errors } = parseBulk('broken [one');
    expect(errors).toHaveLength(1);
    expect(errors[0].raw).toBe('broken [one');
    expect(errors[0].reason).toMatch(/Unclosed \[/);
  });

  it('errors on a second translation or transliteration span in the same segment', () => {
    const { errors } = parseBulk('sentence {one} more {two}');
    expect(errors).toHaveLength(1);
    expect(errors[0].reason).toMatch(/More than one/);
  });

  it('errors on an empty sentence', () => {
    const { errors } = parseBulk('{no sentence}');
    expect(errors).toHaveLength(1);
    expect(errors[0].reason).toBe('Empty sentence');
  });

  it('matches the acceptance-checklist example exactly: 2 valid rows, 2 error rows', () => {
    const input = 'मैं घर जाता हूँ {I go home} [main ghar jaata hoon] § good morning § {no sentence} § broken [one';
    const { valid, errors } = parseBulk(input);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(2);
    expect(valid[0]).toEqual({ sentence: 'मैं घर जाता हूँ', translation: 'I go home', transliteration: 'main ghar jaata hoon' });
    expect(valid[1]).toEqual({ sentence: 'good morning', translation: '', transliteration: '' });
    expect(errors.map((e) => e.reason)).toEqual(['Empty sentence', expect.stringMatching(/Unclosed \[/)]);
  });
});
