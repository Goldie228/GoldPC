import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ProductJsonLd } from './ProductJsonLd';

describe('ProductJsonLd', () => {
  it('renders a script tag with JSON-LD', () => {
    const { container } = render(
      <ProductJsonLd
        name="Test Product"
        description="A test product"
        price={100}
        imageUrl="http://example.com/img.jpg"
      />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('Product');
    expect(data.name).toBe('Test Product');
    expect(data.description).toBe('A test product');
    expect(data.offers.price).toBe(100);
    expect(data.offers.priceCurrency).toBe('BYN');
  });

  it('includes brand when provided', () => {
    const { container } = render(
      <ProductJsonLd
        name="Test"
        description="Desc"
        price={50}
        imageUrl="http://img.jpg"
        brand="Intel"
      />
    );
    const data = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(data.brand.name).toBe('Intel');
  });

  it('includes aggregateRating when provided', () => {
    const { container } = render(
      <ProductJsonLd
        name="Test"
        description="Desc"
        price={50}
        imageUrl="http://img.jpg"
        ratingValue={4.5}
        reviewCount={100}
      />
    );
    const data = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(data.aggregateRating.ratingValue).toBe(4.5);
    expect(data.aggregateRating.reviewCount).toBe(100);
  });
});
