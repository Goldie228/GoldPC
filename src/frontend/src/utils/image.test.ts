import { describe, it, expect } from 'vitest';
import { isXCorePlaceholderUrl, hasValidProductImage, getProductImageUrl } from './image';

describe('isXCorePlaceholderUrl', () => {
  it('returns true for non-string input', () => {
    // @ts-expect-error testing non-string
    expect(isXCorePlaceholderUrl(null)).toBe(true);
    // @ts-expect-error testing non-string
    expect(isXCorePlaceholderUrl(undefined)).toBe(true);
    // @ts-expect-error testing non-string
    expect(isXCorePlaceholderUrl(123)).toBe(true);
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
    // @ts-expect-error testing non-string
    expect(hasValidProductImage(null)).toBe(false);
    // @ts-expect-error testing non-string
    expect(hasValidProductImage(undefined)).toBe(false);
    // @ts-expect-error testing non-string
    expect(hasValidProductImage(42)).toBe(false);
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

  it('returns false for http URLs', () => {
    expect(hasValidProductImage('http://example.com/image.jpg')).toBe(false);
  });

  it('returns false for https URLs', () => {
    expect(hasValidProductImage('https://example.com/image.jpg')).toBe(false);
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
    // @ts-expect-error testing non-string
    expect(getProductImageUrl(null)).toBeNull();
    // @ts-expect-error testing non-string
    expect(getProductImageUrl(undefined)).toBeNull();
    // @ts-expect-error testing non-string
    expect(getProductImageUrl(42)).toBeNull();
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

  it('returns null for http URLs', () => {
    expect(getProductImageUrl('http://example.com/img.jpg')).toBeNull();
  });

  it('returns null for https URLs', () => {
    expect(getProductImageUrl('https://example.com/img.jpg')).toBeNull();
  });

  it('unwraps object with url property', () => {
    const obj = { url: '/uploads/product.jpg' };
    expect(getProductImageUrl(obj as unknown)).toBe('http://localhost/uploads/product.jpg');
  });

  it('returns null for object with external url', () => {
    const obj = { url: 'https://example.com/img.jpg' };
    expect(getProductImageUrl(obj as unknown)).toBeNull();
  });
});
