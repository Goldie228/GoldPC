import { describe, it, expect } from 'vitest';
import { decodeHtmlEntities } from './decodeHtml';

describe('decodeHtmlEntities', () => {
  // ── Named entities ────────────────────────────────────────────────

  describe('named entities', () => {
    it('decodes &amp; to &', () => {
      expect(decodeHtmlEntities('A &amp; B')).toBe('A & B');
    });

    it('decodes &lt; to <', () => {
      expect(decodeHtmlEntities('a &lt; b')).toBe('a < b');
    });

    it('decodes &gt; to >', () => {
      expect(decodeHtmlEntities('a &gt; b')).toBe('a > b');
    });

    it('decodes &quot; to "', () => {
      expect(decodeHtmlEntities('say &quot;hello&quot;')).toBe('say "hello"');
    });

    it('decodes &apos; to \'', () => {
      expect(decodeHtmlEntities('it&apos;s')).toBe("it's");
    });

    it('decodes &nbsp; to space', () => {
      expect(decodeHtmlEntities('a&nbsp;b')).toBe('a b');
    });

    it('decodes multiple named entities in one string', () => {
      expect(decodeHtmlEntities('&amp;&lt;&gt;')).toBe('&<>');
    });
  });

  // ── Numeric hex entities ──────────────────────────────────────────

  describe('numeric hex entities', () => {
    it('decodes hex entity &#x41; to A', () => {
      expect(decodeHtmlEntities('&#x41;')).toBe('A');
    });

    it('decodes hex entity for Cyrillic Г (&#x413;)', () => {
      expect(decodeHtmlEntities('&#x413;')).toBe('Г');
    });

    it('decodes hex with lowercase letters', () => {
      expect(decodeHtmlEntities('&#x4a;')).toBe('J');
    });
  });

  // ── Numeric decimal entities ──────────────────────────────────────

  describe('numeric decimal entities', () => {
    it('decodes decimal entity &#65; to A', () => {
      expect(decodeHtmlEntities('&#65;')).toBe('A');
    });

    it('decodes decimal entity &#1040; to Cyrillic А', () => {
      expect(decodeHtmlEntities('&#1040;')).toBe('А');
    });
  });

  // ── Mixed and edge cases ─────────────────────────────────────────

  describe('mixed and edge cases', () => {
    it('decodes a mix of named and numeric entities', () => {
      expect(decodeHtmlEntities('&amp;&#x41;&#66;')).toBe('&AB');
    });

    it('returns plain text unchanged', () => {
      expect(decodeHtmlEntities('Hello World')).toBe('Hello World');
    });

    it('returns empty string for empty input', () => {
      expect(decodeHtmlEntities('')).toBe('');
    });

    it('returns empty string for falsy input', () => {
      // @ts-expect-error testing null input
      expect(decodeHtmlEntities(null)).toBe('');
      // @ts-expect-error testing undefined input
      expect(decodeHtmlEntities(undefined)).toBe('');
    });

    it('preserves text with no entities', () => {
      expect(decodeHtmlEntities('no entities here')).toBe('no entities here');
    });

    it('handles string with only entities', () => {
      expect(decodeHtmlEntities('&amp;&lt;&gt;&quot;&apos;&nbsp;')).toBe('&<>"\' ');
    });
  });
});
