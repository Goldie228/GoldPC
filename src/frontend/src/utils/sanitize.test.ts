import { describe, expect, it } from 'vitest';
import { sanitizeHtml, createSafeHtml, sanitizeUrl } from './sanitize';

// ─── sanitizeHtml ───────────────────────────────────────────────────────────────

describe('sanitizeHtml', () => {
  it('возвращает пустую строку для null', () => {
    expect(sanitizeHtml(null as unknown as string)).toBe('');
  });

  it('возвращает пустую строку для undefined', () => {
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });

  it('возвращает пустую строку для пустой строки', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('возвращает пустую строку для нестрокового значения', () => {
    expect(sanitizeHtml(123 as unknown as string)).toBe('');
  });

  it('оставляет безопасный текст без тегов', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });

  it('strict: разрешает жирный и курсив', () => {
    const result = sanitizeHtml('<b>bold</b> and <i>italic</i>', 'strict');
    expect(result).toContain('<b>');
    expect(result).toContain('<i>');
  });

  it('strict: убирает скрипты', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>', 'strict');
    expect(result).not.toContain('<script>');
  });

  it('strict: убирает опасные теги (iframe, object, embed)', () => {
    const result = sanitizeHtml('<iframe src="evil.com"></iframe>', 'strict');
    expect(result).not.toContain('<iframe>');
  });

  it('moderate: разрешает ссылки', () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>', 'moderate');
    expect(result).toContain('<a');
    expect(result).toContain('href=');
  });

  it('moderate: убирает javascript: в href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>', 'moderate');
    expect(result).not.toContain('javascript:');
  });

  it('permissive: разрешает изображения', () => {
    const result = sanitizeHtml('<img src="photo.jpg" alt="pic" />', 'permissive');
    expect(result).toContain('<img');
  });

  it('permissive: убирает data: URI в src', () => {
    const result = sanitizeHtml(
      '<img src="data:text/html,<script>alert(1)</script>" />',
      'permissive'
    );
    expect(result).not.toContain('data:text/html');
  });

  it('strict по умолчанию', () => {
    const result = sanitizeHtml('<b>ok</b><script>bad</script>');
    expect(result).toContain('<b>');
    expect(result).not.toContain('<script>');
  });

  it('moderate: разрешает списки', () => {
    const result = sanitizeHtml('<ul><li>item</li></ul>', 'moderate');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  it('permissive: разрешает заголовки', () => {
    const result = sanitizeHtml('<h1>Title</h1>', 'permissive');
    expect(result).toContain('<h1>');
  });
});

// ─── createSafeHtml ─────────────────────────────────────────────────────────────

describe('createSafeHtml', () => {
  it('возвращает объект с __html', () => {
    const result = createSafeHtml('<b>test</b>');
    expect(result).toHaveProperty('__html');
    expect(typeof result.__html).toBe('string');
  });

  it(' sanitizeHtml результат в __html', () => {
    const result = createSafeHtml('<b>bold</b>');
    expect(result.__html).toBe(sanitizeHtml('<b>bold</b>'));
  });

  it('передаёт level в sanitizeHtml', () => {
    const result = createSafeHtml('<a href="https://example.com">link</a>', 'moderate');
    expect(result.__html).toContain('<a');
  });

  it('strict по умолчанию', () => {
    const result = createSafeHtml('<script>alert(1)</script>');
    expect(result.__html).not.toContain('<script>');
  });

  it('возвращает пустой __html для null', () => {
    const result = createSafeHtml(null as unknown as string);
    expect(result.__html).toBe('');
  });

  it('возвращает пустой __html для undefined', () => {
    const result = createSafeHtml(undefined as unknown as string);
    expect(result.__html).toBe('');
  });
});

// ─── sanitizeUrl ────────────────────────────────────────────────────────────────

describe('sanitizeUrl', () => {
  it('возвращает null для null', () => {
    expect(sanitizeUrl(null)).toBeNull();
  });

  it('возвращает null для undefined', () => {
    expect(sanitizeUrl(undefined)).toBeNull();
  });

  it('возвращает null для пустой строки', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  it('возвращает null для строки только из пробелов', () => {
    expect(sanitizeUrl('   ')).toBeNull();
  });

  it('пропускает https:// ссылки', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('пропускает http:// ссылки', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('пропускает mailto: ссылки', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('пропускает tel: ссылки', () => {
    expect(sanitizeUrl('tel:+375291234567')).toBe('tel:+375291234567');
  });

  it('пропускает относительные ссылки с /', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('пропускает якорные ссылки', () => {
    expect(sanitizeUrl('#section')).toBe('#section');
  });

  it('пропускает ссылки начинающиеся с .', () => {
    expect(sanitizeUrl('./relative/file.html')).toBe('./relative/file.html');
  });

  it('возвращает null для javascript: ссылок', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('возвращает null для JavaScript: (регистр)', () => {
    expect(sanitizeUrl('JavaScript:alert(1)')).toBeNull();
  });

  it('возвращает null для vbscript: ссылок', () => {
    expect(sanitizeUrl('vbscript:MsgBox(1)')).toBeNull();
  });

  it('возвращает null для data:text/html ссылок', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('возвращает null для file:// ссылок', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });

  it('возвращает null для blob: ссылок', () => {
    expect(sanitizeUrl('blob:https://example.com/id')).toBeNull();
  });

  it('пропускает ftp:// ссылки', () => {
    expect(sanitizeUrl('ftp://files.example.com/doc.pdf')).toBe('ftp://files.example.com/doc.pdf');
  });

  it('пропускает URL без протокола (просто домен)', () => {
    expect(sanitizeUrl('example.com')).toBe('example.com');
  });

  it('обрезает пробелы по краям', () => {
    expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('возвращает null для нестроковых значений', () => {
    expect(sanitizeUrl(123 as unknown as string)).toBeNull();
  });
});
