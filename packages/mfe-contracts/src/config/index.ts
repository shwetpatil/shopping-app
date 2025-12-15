/**
 * Shared Configuration for Microfrontends
 * Central configuration management across all MFEs
 */

export interface MFEConfig {
  name: string;
  version: string;
  port: number;
  url: string;
  healthCheckEndpoint?: string;
}

export interface SharedConfig {
  environment: 'development' | 'staging' | 'production';
  apiGateway: string;
  mfes: Record<string, MFEConfig>;
  features: {
    enableAnalytics: boolean;
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
  };
  cdn?: {
    url: string;
    assetsPath: string;
  };
  auth?: {
    tokenKey: string;
    refreshTokenKey: string;
  };
}

export const config: SharedConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  apiGateway: process.env.NEXT_PUBLIC_API_GATEWAY || 'http://localhost:4000',
  
  mfes: {
    shell: {
      name: 'mfe-shell',
      version: '1.0.0',
      port: 3000,
      url: process.env.NEXT_PUBLIC_SHELL_URL || 'http://localhost:3000',
      healthCheckEndpoint: '/api/health',
    },
    search: {
      name: 'mfe-search',
      version: '1.0.0',
      port: 3001,
      url: process.env.NEXT_PUBLIC_SEARCH_URL || 'http://localhost:3001',
      healthCheckEndpoint: '/api/health',
    },
    wishlist: {
      name: 'mfe-wishlist',
      version: '1.0.0',
      port: 3002,
      url: process.env.NEXT_PUBLIC_WISHLIST_URL || 'http://localhost:3002',
      healthCheckEndpoint: '/api/health',
    },
    reviews: {
      name: 'mfe-reviews',
      version: '1.0.0',
      port: 3003,
      url: process.env.NEXT_PUBLIC_REVIEWS_URL || 'http://localhost:3003',
      healthCheckEndpoint: '/api/health',
    },
    products: {
      name: 'mfe-products',
      version: '1.0.0',
      port: 3004,
      url: process.env.NEXT_PUBLIC_PRODUCTS_URL || 'http://localhost:3004',
      healthCheckEndpoint: '/api/health',
    },
    cart: {
      name: 'mfe-cart',
      version: '1.0.0',
      port: 3005,
      url: process.env.NEXT_PUBLIC_CART_URL || 'http://localhost:3005',
      healthCheckEndpoint: '/api/health',
    },
  },

  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableErrorTracking: process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING === 'true',
    enablePerformanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE === 'true',
  },

  cdn: {
    url: process.env.NEXT_PUBLIC_CDN_URL || '',
    assetsPath: '/assets',
  },

  auth: {
    tokenKey: 'mfe_auth_token',
    refreshTokenKey: 'mfe_refresh_token',
  },
};

/**
 * Get MFE URL with fallback
 */
export function getMFEUrl(mfeName: keyof typeof config.mfes): string {
  return config.mfes[mfeName]?.url || '';
}

/**
 * Check if MFE is available
 */
export async function checkMFEHealth(mfeName: keyof typeof config.mfes): Promise<boolean> {
  const mfe = config.mfes[mfeName];
  if (!mfe || !mfe.healthCheckEndpoint) return false;

  try {
    const response = await fetch(`${mfe.url}${mfe.healthCheckEndpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.error(`[Config] Health check failed for ${mfeName}:`, error);
    return false;
  }
}

/**
 * Get API endpoint with gateway prefix
 */
export function getApiUrl(path: string): string {
  return `${config.apiGateway}${path}`;
}

export default config;
