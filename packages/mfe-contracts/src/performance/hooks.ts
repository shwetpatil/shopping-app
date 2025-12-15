/**
 * Performance Monitoring Hooks for Microfrontends
 * Track loading times, interactions, and custom metrics
 */

import { useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  mfeName?: string;
}

// Performance tracking utility
class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, mfeName?: string): number | null {
    const startTime = this.marks.get(startMark);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      mfeName,
    });

    this.marks.delete(startMark);
    return duration;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  reportToAnalytics(): void {
    // Send metrics to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      this.metrics.forEach((metric) => {
        (window as any).gtag('event', 'timing_complete', {
          name: metric.name,
          value: Math.round(metric.duration),
          event_category: metric.mfeName || 'MFE',
        });
      });
    }
  }
}

export const performanceTracker = new PerformanceTracker();

/**
 * Hook to measure component mount time
 */
export function useMFELoadTime(mfeName: string, componentName?: string) {
  const mountedRef = useRef(false);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!mountedRef.current) {
      const duration = performance.now() - startTimeRef.current;
      const metricName = componentName 
        ? `${mfeName}:${componentName}:load`
        : `${mfeName}:load`;

      console.log(`[Performance] ${metricName}: ${duration.toFixed(2)}ms`);
      
      // Add metric via public method
      performanceTracker.mark(metricName);
      performanceTracker.measure(metricName, metricName, mfeName);

      mountedRef.current = true;
    }
  }, [mfeName, componentName]);
}

/**
 * Hook to measure interaction time (e.g., button click to response)
 */
export function useMFEInteraction(mfeName: string) {
  const startInteraction = (interactionName: string) => {
    const markName = `${mfeName}:${interactionName}:start`;
    performanceTracker.mark(markName);
    return markName;
  };

  const endInteraction = (startMark: string, interactionName: string) => {
    const duration = performanceTracker.measure(
      `${mfeName}:${interactionName}`,
      startMark,
      mfeName
    );

    if (duration !== null) {
      console.log(`[Performance] ${mfeName}:${interactionName}: ${duration.toFixed(2)}ms`);
    }
  };

  return { startInteraction, endInteraction };
}

/**
 * Hook to track API call performance
 */
export function useMFEApiTracking(mfeName: string) {
  const trackApiCall = async <T,>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;

      // Log performance
      console.log(`[Performance] ${mfeName}:api:${apiName}: ${duration.toFixed(2)}ms`);
      
      // Store metric
      const metricName = `${mfeName}:api:${apiName}`;
      performanceTracker.mark(metricName);
      performanceTracker.measure(metricName, metricName, mfeName);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[Performance] ${mfeName}:api:${apiName} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  };

  return { trackApiCall };
}

/**
 * Hook to track bundle size and load time
 */
export function useMFEBundleMetrics(mfeName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track bundle size using Navigation Timing API
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navTiming) {
      const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
      const domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;

      console.log(`[Performance] ${mfeName} Bundle Metrics:`, {
        totalLoadTime: `${loadTime.toFixed(2)}ms`,
        domContentLoaded: `${domContentLoaded.toFixed(2)}ms`,
        transferSize: navTiming.transferSize ? `${(navTiming.transferSize / 1024).toFixed(2)}KB` : 'N/A',
      });
    }
  }, [mfeName]);
}

/**
 * Export performance report
 */
export function exportPerformanceReport(): string {
  const metrics = performanceTracker.getMetrics();
  
  const report = {
    timestamp: new Date().toISOString(),
    metrics: metrics.map(m => ({
      name: m.name,
      duration: `${m.duration.toFixed(2)}ms`,
      mfe: m.mfeName,
    })),
    summary: {
      totalMetrics: metrics.length,
      averageDuration: metrics.length > 0
        ? `${(metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length).toFixed(2)}ms`
        : 'N/A',
    },
  };

  return JSON.stringify(report, null, 2);
}
