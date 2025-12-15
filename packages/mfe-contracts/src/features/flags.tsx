/**
 * Feature Flags System for Microfrontends
 * Enable/disable features without deployments
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  mfeScope?: string[];
  rolloutPercentage?: number;
}

export interface FeatureFlagsConfig {
  flags: Record<string, FeatureFlag>;
  environment?: 'development' | 'staging' | 'production';
}

class FeatureFlagsManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private environment: string = 'development';

  initialize(config: FeatureFlagsConfig): void {
    this.environment = config.environment || 'development';
    Object.entries(config.flags).forEach(([key, flag]) => {
      this.flags.set(key, flag);
    });

    console.log(`[FeatureFlags] Initialized with ${this.flags.size} flags in ${this.environment} mode`);
  }

  isEnabled(flagKey: string, mfeName?: string): boolean {
    const flag = this.flags.get(flagKey);
    
    if (!flag) {
      console.warn(`[FeatureFlags] Flag "${flagKey}" not found, defaulting to false`);
      return false;
    }

    // Check MFE scope
    if (mfeName && flag.mfeScope && !flag.mfeScope.includes(mfeName)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const userId = this.getUserId();
      const hash = this.hashString(`${flagKey}-${userId}`);
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  setFlag(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = enabled;
      this.flags.set(key, flag);
      console.log(`[FeatureFlags] Updated flag "${key}" to ${enabled}`);
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  private getUserId(): string {
    // Get or generate user ID for consistent rollout
    if (typeof window === 'undefined') return 'server';
    
    let userId = localStorage.getItem('mfe-user-id');
    if (!userId) {
      userId = Math.random().toString(36).substring(7);
      localStorage.setItem('mfe-user-id', userId);
    }
    return userId;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagsManager();

/**
 * React Hook for feature flags
 */
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: string, mfeName?: string): boolean {
  const [isEnabled, setIsEnabled] = useState(
    featureFlags.isEnabled(flagKey, mfeName)
  );

  useEffect(() => {
    // Listen for flag changes
    const checkFlag = () => {
      setIsEnabled(featureFlags.isEnabled(flagKey, mfeName));
    };

    // Re-check periodically (for remote config updates)
    const interval = setInterval(checkFlag, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [flagKey, mfeName]);

  return isEnabled;
}

/**
 * Component wrapper for feature flags
 */
import React, { ReactNode } from 'react';

interface FeatureFlagProps {
  flag: string;
  mfeName?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureFlagWrapper({ flag, mfeName, children, fallback }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag, mfeName);

  if (!isEnabled) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Default feature flags configuration
 */
export const defaultFeatureFlags: FeatureFlagsConfig = {
  environment: 'development',
  flags: {
    'new-checkout-flow': {
      key: 'new-checkout-flow',
      enabled: false,
      description: 'New optimized checkout flow',
      mfeScope: ['mfe-cart'],
      rolloutPercentage: 0,
    },
    'product-recommendations': {
      key: 'product-recommendations',
      enabled: true,
      description: 'AI-powered product recommendations',
      mfeScope: ['mfe-products'],
    },
    'advanced-search': {
      key: 'advanced-search',
      enabled: false,
      description: 'Advanced search filters and facets',
      mfeScope: ['mfe-search'],
      rolloutPercentage: 50,
    },
    'wishlist-sharing': {
      key: 'wishlist-sharing',
      enabled: false,
      description: 'Share wishlist with friends',
      mfeScope: ['mfe-wishlist'],
    },
    'review-media-upload': {
      key: 'review-media-upload',
      enabled: true,
      description: 'Upload images and videos in reviews',
      mfeScope: ['mfe-reviews'],
    },
  },
};
