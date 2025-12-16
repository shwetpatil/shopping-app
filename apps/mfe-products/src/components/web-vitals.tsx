'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { logger } from '../lib/logger';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log Web Vitals for monitoring
    const { name, value, rating, id } = metric;
    
    // Log metrics in development
    logger.info(`[Web Vitals] ${name}`, {
      value: Math.round(value),
      rating,
      id,
    });
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics endpoint
      // Example: sendToAnalytics(metric);
      
      // Or use a monitoring service
      // Example: 
      // - Google Analytics: gtag('event', name, { value, metric_id: id, metric_rating: rating });
      // - Vercel Analytics: analytics.track(name, { value, id, rating });
      // - Custom endpoint: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(metric) });
    }
  });
  
  return null;
}
