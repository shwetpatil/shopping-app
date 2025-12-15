/**
 * SEO Utilities for Next.js Microfrontends
 * Helps with metadata generation, structured data, and SEO optimization
 */

export interface MetadataConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  siteName?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ProductSchema {
  name: string;
  description: string;
  image: string[];
  brand?: string;
  offers: {
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    url?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

/**
 * Generate Open Graph metadata
 */
export function generateOpenGraph(config: MetadataConfig): Record<string, string> {
  return {
    'og:title': config.title,
    'og:description': config.description,
    'og:type': config.type || 'website',
    'og:url': config.url || '',
    'og:image': config.image || '',
    'og:site_name': config.siteName || 'Shopping App',
    'og:locale': config.locale || 'en_US',
  };
}

/**
 * Generate Twitter Card metadata
 */
export function generateTwitterCard(config: MetadataConfig): Record<string, string> {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title,
    'twitter:description': config.description,
    'twitter:image': config.image || '',
  };
}

/**
 * Generate metadata for Next.js
 */
export function generateMetadata(config: MetadataConfig) {
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', '),
    openGraph: {
      title: config.title,
      description: config.description,
      type: config.type || 'website',
      url: config.url,
      images: config.image ? [{ url: config.image }] : [],
      siteName: config.siteName || 'Shopping App',
      locale: config.locale || 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.image ? [config.image] : [],
    },
  };
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate JSON-LD structured data for products
 */
export function generateProductSchema(product: ProductSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.offers.price,
      priceCurrency: product.offers.currency,
      availability: `https://schema.org/${product.offers.availability}`,
      url: product.offers.url,
    },
    aggregateRating: product.aggregateRating ? {
      '@type': 'AggregateRating',
      ratingValue: product.aggregateRating.ratingValue,
      reviewCount: product.aggregateRating.reviewCount,
    } : undefined,
  };
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationSchema(config: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.url,
    logo: config.logo,
    description: config.description,
    contactPoint: config.contactPoint ? {
      '@type': 'ContactPoint',
      telephone: config.contactPoint.telephone,
      contactType: config.contactPoint.contactType,
    } : undefined,
  };
}

/**
 * Generate JSON-LD structured data for website
 */
export function generateWebsiteSchema(config: {
  name: string;
  url: string;
  description?: string;
  searchUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: config.url,
    description: config.description,
    potentialAction: config.searchUrl ? {
      '@type': 'SearchAction',
      target: `${config.searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    } : undefined,
  };
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${cleanBase}/${cleanPath}`;
}

/**
 * Generate robots meta tag
 */
export function generateRobotsMeta(config: {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
}): string {
  const directives: string[] = [];
  
  if (config.index !== false) directives.push('index');
  else directives.push('noindex');
  
  if (config.follow !== false) directives.push('follow');
  else directives.push('nofollow');
  
  if (config.noarchive) directives.push('noarchive');
  if (config.nosnippet) directives.push('nosnippet');
  
  return directives.join(', ');
}

/**
 * Generate sitemap entry
 */
export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemapXML(entries: SitemapEntry[]): string {
  const urls = entries.map(entry => `
    <url>
      <loc>${entry.url}</loc>
      ${entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : ''}
      ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}
      ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
    </url>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Remove special characters and convert to lowercase
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Count word frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}
