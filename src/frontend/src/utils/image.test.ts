import { describe, it, expect } from 'vitest';
import { isXCorePlaceholderUrl, hasValidProductImage, getProductImageUrl } from './image';

describe('isXCorePlaceholderUrl', () => {
  it('returns true for non-string input', () => {
    expect(isXCorePlaceholderUrl(null as unknown)).toBe(true);
    expect(isXCorePlaceholderUrl(undefined as unknown)).toBe(true);
    expect(isXCorePlaceholderUrl(123 as unknown)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isXCorePlaceholderUrl('')).toBe(true);
  });

  it('returns true for strings containing /upload/CNext/', () => {
    expect(isXCorePlaceholderUrl('/upload/CNext/logo.png')).toBe(true);
    expect(isXCorePlaceholderUrl('https://example.com/upload/CNext/img.jpg')).toBe(true);
  });

  it('returns false for regular upload paths', () => {
    expect(isXCorePlaceholderUrl('/uploads/product/image.jpg')).toBe(false);
  });

  it('returns false for completely unrelated URLs', () => {
    expect(isXCorePlaceholderUrl('https://example.com/photo.jpg')).toBe(false);
  });
});

describe('hasValidProductImage', () => {
  it('returns false for non-string input', () => {
    expect(hasValidProductImage(null as unknown)).toBe(false);
    expect(hasValidProductImage(undefined as unknown)).toBe(false);
    expect(hasValidProductImage(42 as unknown)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasValidProductImage('')).toBe(false);
  });

  it('returns true for local /uploads/ path', () => {
    expect(hasValidProductImage('/uploads/product/image.jpg')).toBe(true);
  });

  it('returns true for uploads/ without leading slash', () => {
    expect(hasValidProductImage('uploads/product/image.jpg')).toBe(true);
  });

  it('returns true for http URLs', () => {
    expect(hasValidProductImage('http://example.com/image.jpg')).toBe(true);
  });

  it('returns true for https URLs', () => {
    expect(hasValidProductImage('https://example.com/image.jpg')).toBe(true);
  });

  it('returns false for protocol-relative URLs', () => {
    expect(hasValidProductImage('//example.com/image.jpg')).toBe(false);
  });

  it('returns false for XCore placeholder paths', () => {
    expect(hasValidProductImage('/upload/CNext/logo.png')).toBe(false);
  });
});

describe('getProductImageUrl', () => {
  it('returns null for non-string input', () => {
    expect(getProductImageUrl(null as unknown)).toBeNull();
    expect(getProductImageUrl(undefined as unknown)).toBeNull();
    expect(getProductImageUrl(42 as unknown)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getProductImageUrl('')).toBeNull();
  });

  it('returns absolute URL for local /uploads/ path', () => {
    const result = getProductImageUrl('/uploads/product.jpg');
    expect(result).toBe('http://localhost/uploads/product.jpg');
  });

  it('returns absolute URL for uploads without leading slash', () => {
    const result = getProductImageUrl('uploads/product.jpg');
    expect(result).toBe('http://localhost/uploads/product.jpg');
  });

  it('returns http URL as-is', () => {
    expect(getProductImageUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
  });

  it('returns https URL as-is', () => {
    expect(getProductImageUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('unwraps object with url property', () => {
    const obj = { url: '/uploads/product.jpg' };
    expect(getProductImageUrl(obj as unknown)).toBe('http://localhost/uploads/product.jpg');
  });

  it('returns external url from object as-is', () => {
    const obj = { url: 'https://example.com/img.jpg' };
    expect(getProductImageUrl(obj as unknown)).toBe('https://example.com/img.jpg');
  });
});
