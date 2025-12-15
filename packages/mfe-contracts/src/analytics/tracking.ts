/**
 * Analytics Tracking Utility
 * Consistent event tracking across all MFEs
 */

export type AnalyticsEventCategory =
  | 'user'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'search'
  | 'wishlist'
  | 'review'
  | 'navigation'
  | 'engagement';

export interface AnalyticsEvent {
  category: AnalyticsEventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface AnalyticsUser {
  userId?: string;
  sessionId?: string;
  traits?: Record<string, any>;
}

export interface AnalyticsConfig {
  mfeName: string;
  enableDebug?: boolean;
  providers?: AnalyticsProvider[];
}

export interface AnalyticsProvider {
  name: string;
  track: (event: AnalyticsEvent, user?: AnalyticsUser) => void | Promise<void>;
  identify: (user: AnalyticsUser) => void | Promise<void>;
  page: (name: string, properties?: Record<string, any>) => void | Promise<void>;
}

class AnalyticsManager {
  private config: AnalyticsConfig;
  private user: AnalyticsUser | null = null;
  private providers: AnalyticsProvider[] = [];
  private eventQueue: Array<{ event: AnalyticsEvent; user?: AnalyticsUser }> = [];

  constructor(config: AnalyticsConfig) {
    this.config = {
      enableDebug: false,
      providers: [],
      ...config,
    };
    
    this.providers = this.config.providers || [];
    
    // Generate session ID
    this.user = {
      sessionId: this.generateSessionId(),
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug message
   */
  private debug(message: string, data?: any): void {
    if (this.config.enableDebug) {
      console.log(`[Analytics:${this.config.mfeName}]`, message, data || '');
    }
  }

  /**
   * Identify user
   */
  identify(user: AnalyticsUser): void {
    this.user = {
      ...this.user,
      ...user,
    };

    this.debug('User identified', this.user);

    // Send to all providers
    this.providers.forEach(provider => {
      try {
        provider.identify(this.user!);
      } catch (error) {
        console.error(`Failed to identify user with ${provider.name}:`, error);
      }
    });
  }

  /**
   * Track event
   */
  track(event: AnalyticsEvent): void {
    const enrichedEvent: AnalyticsEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        mfeName: this.config.mfeName,
        timestamp: new Date().toISOString(),
        sessionId: this.user?.sessionId,
        userId: this.user?.userId,
      },
    };

    this.debug('Track event', enrichedEvent);

    // Send to all providers
    this.providers.forEach(provider => {
      try {
        provider.track(enrichedEvent, this.user || undefined);
      } catch (error) {
        console.error(`Failed to track event with ${provider.name}:`, error);
      }
    });
  }

  /**
   * Track page view
   */
  page(name: string, properties?: Record<string, any>): void {
    const enrichedProperties = {
      ...properties,
      mfeName: this.config.mfeName,
      timestamp: new Date().toISOString(),
      sessionId: this.user?.sessionId,
      userId: this.user?.userId,
    };

    this.debug('Page view', { name, properties: enrichedProperties });

    // Send to all providers
    this.providers.forEach(provider => {
      try {
        provider.page(name, enrichedProperties);
      } catch (error) {
        console.error(`Failed to track page view with ${provider.name}:`, error);
      }
    });
  }

  /**
   * Add analytics provider
   */
  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
    this.debug('Provider added', provider.name);
  }

  /**
   * Remove analytics provider
   */
  removeProvider(providerName: string): void {
    this.providers = this.providers.filter(p => p.name !== providerName);
    this.debug('Provider removed', providerName);
  }
}

/**
 * Create analytics manager instance
 */
export function createAnalytics(config: AnalyticsConfig): AnalyticsManager {
  return new AnalyticsManager(config);
}

/**
 * Google Analytics Provider
 */
export function createGoogleAnalyticsProvider(measurementId: string): AnalyticsProvider {
  return {
    name: 'Google Analytics',
    track: (event, user) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          user_id: user?.userId,
          ...event.metadata,
        });
      }
    },
    identify: (user) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', measurementId, {
          user_id: user.userId,
          ...user.traits,
        });
      }
    },
    page: (name, properties) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'page_view', {
          page_title: name,
          ...properties,
        });
      }
    },
  };
}

/**
 * Console Provider (for debugging)
 */
export function createConsoleProvider(): AnalyticsProvider {
  return {
    name: 'Console',
    track: (event, user) => {
      console.log('[Analytics] Track:', event, user);
    },
    identify: (user) => {
      console.log('[Analytics] Identify:', user);
    },
    page: (name, properties) => {
      console.log('[Analytics] Page:', name, properties);
    },
  };
}

/**
 * Custom API Provider
 */
export function createAPIProvider(endpoint: string): AnalyticsProvider {
  return {
    name: 'Custom API',
    track: async (event, user) => {
      try {
        await fetch(`${endpoint}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, user }),
        });
      } catch (error) {
        console.error('Failed to send analytics event:', error);
      }
    },
    identify: async (user) => {
      try {
        await fetch(`${endpoint}/identify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user }),
        });
      } catch (error) {
        console.error('Failed to identify user:', error);
      }
    },
    page: async (name, properties) => {
      try {
        await fetch(`${endpoint}/page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, properties }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    },
  };
}

// Export types and functions
export { AnalyticsManager };
