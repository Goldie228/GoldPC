/**
 * Decode HTML entities in a string
 * React does NOT automatically decode entities like &#x413; - they render as-is
 * This utility converts them to proper Unicode characters
 */

/**
 * Decode HTML numeric character references (&#xHHHH; and &#DDD;)
 * and common named entities (&amp;, &lt;, &gt;, &quot;, &apos;)
 */
const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
};

const NAMED_REGEX = /&(amp|lt|gt|quot|apos|nbsp);/g;

const NUMERIC_REGEX = /&#(x([0-9a-fA-F]+)|([0-9]+));/g;

export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') return text || "";

  let decoded = text;

  // Decode named entities
  decoded = decoded.replace(NAMED_REGEX, (match) => NAMED_ENTITIES[match] ?? match);

  // Decode numeric entities (decimal and hexadecimal)
  decoded = decoded.replace(NUMERIC_REGEX, (_, _hexPrefix, hex, dec) => {
    if (hex) {
      return String.fromCodePoint(parseInt(hex, 16));
    }
    if (dec) {
      return String.fromCodePoint(parseInt(dec, 10));
    }
    return _;
  });

  return decoded || '';
}
