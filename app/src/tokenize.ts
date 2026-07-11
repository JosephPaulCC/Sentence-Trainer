/** tokens = sentence.trim().split(/\s+/) — punctuation is never stripped. */
export function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/);
}

const RTL_RANGE_START = 0x0590;
const RTL_RANGE_END = 0x08ff;

/** Arabic/Urdu/Persian scripts (U+0590-U+08FF) render right-to-left. */
export function isRtl(sentence: string): boolean {
  for (const ch of sentence) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= RTL_RANGE_START && code <= RTL_RANGE_END) return true;
  }
  return false;
}
