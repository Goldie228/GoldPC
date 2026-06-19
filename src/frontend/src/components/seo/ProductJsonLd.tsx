interface ProductJsonLdProps {
  name: string;
  description: string;
  price: number;
  currency?: string;
  imageUrl: string;
  availability?: string;
  brand?: string;
  sku?: string;
  url?: string;
  ratingValue?: number;
  reviewCount?: number;
}

export function ProductJsonLd({
  name,
  description,
  price,
  currency = 'BYN',
  imageUrl,
  availability = 'https://schema.org/InStock',
  brand,
  sku,
  url,
  ratingValue,
  reviewCount,
}: ProductJsonLdProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: imageUrl,
    sku,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability,
      url,
    },
  };

  if (ratingValue != null && reviewCount != null) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
