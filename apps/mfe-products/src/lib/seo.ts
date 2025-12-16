import type { Metadata } from 'next';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  brand?: string;
  inStock?: boolean;
}

/**
 * Generate SEO metadata for product pages
 */
export function generateProductMetadata(product: Product): Metadata {
  const title = `${product.name} | Products MFE`;
  const description = product.description || `Shop ${product.name} at the best price. ${product.inStock ? 'In stock' : 'Out of stock'}.`;
  const images = [
    {
      url: product.imageUrl,
      width: 800,
      height: 800,
      alt: product.name,
    },
  ];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.imageUrl],
    },
  };
}

/**
 * Generate JSON-LD structured data for product
 */
export function generateProductSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
    } : undefined,
  };
}

/**
 * Generate JSON-LD for product list page
 */
export function generateProductListSchema(products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        image: product.imageUrl,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
        },
      },
    })),
  };
}
