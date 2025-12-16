/**
 * Analytics Tracking Utilities
 * Supports Google Analytics, Mixpanel, and custom events
 */

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

type ProductEvent = {
  productId: string;
  productName: string;
  category: string;
  price: number;
  quantity?: number;
};

/**
 * Send event to Google Analytics (gtag)
 */
export function trackGAEvent(event: AnalyticsEvent): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event.name, event.properties);
  }
}

/**
 * Send event to Mixpanel
 */
export function trackMixpanelEvent(event: AnalyticsEvent): void {
  if (typeof window !== 'undefined' && window.mixpanel) {
    window.mixpanel.track(event.name, event.properties);
  }
}

/**
 * Universal event tracker - sends to all configured analytics platforms
 */
export function trackEvent(event: AnalyticsEvent): void {
  // eslint-disable-next-line no-console
  console.log('📊 Analytics Event:', event);
  
  // Send to all platforms
  trackGAEvent(event);
  trackMixpanelEvent(event);
  
  // Add custom analytics platform here
}

/**
 * Track page view
 */
export function trackPageView(url: string, title?: string): void {
  trackEvent({
    name: 'page_view',
    properties: {
      page_url: url,
      page_title: title || document.title,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track product view
 */
export function trackProductView(product: ProductEvent): void {
  trackEvent({
    name: 'product_view',
    properties: {
      product_id: product.productId,
      product_name: product.productName,
      category: product.category,
      price: product.price,
      currency: 'USD',
    },
  });
}

/**
 * Track add to cart
 */
export function trackAddToCart(product: ProductEvent): void {
  trackEvent({
    name: 'add_to_cart',
    properties: {
      product_id: product.productId,
      product_name: product.productName,
      category: product.category,
      price: product.price,
      quantity: product.quantity || 1,
      currency: 'USD',
      value: product.price * (product.quantity || 1),
    },
  });
}

/**
 * Track add to wishlist
 */
export function trackAddToWishlist(product: ProductEvent): void {
  trackEvent({
    name: 'add_to_wishlist',
    properties: {
      product_id: product.productId,
      product_name: product.productName,
      category: product.category,
      price: product.price,
    },
  });
}

/**
 * Track product share
 */
export function trackProductShare(product: ProductEvent, method: string): void {
  trackEvent({
    name: 'product_share',
    properties: {
      product_id: product.productId,
      product_name: product.productName,
      share_method: method,
    },
  });
}

/**
 * Track search
 */
export function trackSearch(query: string, results: number): void {
  trackEvent({
    name: 'search',
    properties: {
      search_query: query,
      results_count: results,
    },
  });
}

/**
 * Track filter usage
 */
export function trackFilterApplied(filterType: string, filterValue: string | number): void {
  trackEvent({
    name: 'filter_applied',
    properties: {
      filter_type: filterType,
      filter_value: filterValue,
    },
  });
}

// Extend window type for analytics
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    mixpanel?: {
      track: (name: string, properties?: Record<string, unknown>) => void;
    };
  }
}
