/**
 * @shopping-app/mfe-contracts v1.1.0
 * 
 * Shared TypeScript contracts and interfaces for microfrontend communication
 * Ensures type safety across all MFEs
 * 
 * @packageDocumentation
 */

// Types
export * from './types/product';
export * from './types/cart';
export * from './types/wishlist';
export * from './types/review';
export * from './types/search';
export * from './types/user';

// Component Props Contracts
export * from './components/props';

// Components
export { MFEErrorBoundary } from './components/ErrorBoundary';

// Events
export * from './events/types';
export * from './events/bus';
export * from './events/hooks';

// Performance Monitoring
export * from './performance/hooks';

// Feature Flags
export * from './features/flags';

// Configuration
export * from './config';

// Authentication
export { authManager, useAuth, withAuth } from './auth/manager';
export type { AuthState as AuthManagerState } from './auth/manager';

// Analytics
export * from './analytics/tracking';

// Health Checks
export * from './health/checks';

// Accessibility
export * from './a11y/utils';
