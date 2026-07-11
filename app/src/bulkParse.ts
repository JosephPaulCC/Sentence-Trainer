export interface BulkValidRow {
  sentence: string;
  translation: string;
  transliteration: string;
}

export interface BulkErrorRow {
  raw: string;
  reason: string;
}

export interface BulkParseResult {
  valid: BulkValidRow[];
  errors: BulkErrorRow[];
}

const SECTION_DELIMITER = String.fromCharCode(0xa7); // §

interface SpanResult {
  rest: string;
  value: string;
  error: string | null;
}

function extractSpan(str: string, open: string, close: string): SpanResult {
  const i = str.indexOf(open);
  if (i === -1) return { rest: str, value: '', error: null };
  const j = str.indexOf(close, i + 1);
  if (j === -1) return { rest: str, value: '', error: `Unclosed ${open} — missing ${close}` };
  const value = str.slice(i + 1, j);
  const rest = str.slice(0, i) + ' ' + str.slice(j + 1);
  const k = rest.indexOf(open);
  if (k !== -1) {
    const hasSecondClose = rest.indexOf(close, k + 1) !== -1;
    return {
      rest,
      value,
      error: hasSecondClose
        ? `More than one ${open}…${close} span`
        : `Unclosed ${open} — missing ${close}`,
    };
  }
  return { rest, value, error: null };
}

function parseSegment(segment: string): { error: string } | BulkValidRow {
  const translation = extractSpan(segment, '{', '}');
  if (translation.error) return { error: translation.error };
  const transliteration = extractSpan(translation.rest, '[', ']');
  if (transliteration.error) return { error: transliteration.error };
  const sentence = transliteration.rest.replace(/\s+/g, ' ').trim();
  if (!sentence) return { error: 'Empty sentence' };
  return {
    sentence,
    translation: translation.value.trim(),
    transliteration: transliteration.value.trim(),
  };
}

/**
 * Parses the bulk-add textarea grammar (§ starts a new card, {} wraps
 * translation, [] wraps transliteration). Pure and side-effect free so it is
 * testable in isolation.
 */
export function parseBulk(input: string): BulkParseResult {
  const segments = input
    .split(SECTION_DELIMITER)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const valid: BulkValidRow[] = [];
  const errors: BulkErrorRow[] = [];

  for (const segment of segments) {
    const result = parseSegment(segment);
    if ('error' in result) errors.push({ raw: segment, reason: result.error });
    else valid.push(result);
  }

  return { valid, errors };
}
