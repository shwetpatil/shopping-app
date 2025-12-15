/**
 * Event types for cross-MFE communication
 * Using discriminated unions for type-safe event handling
 */

import type { SearchFilters } from '../types/search';
import type { User } from '../types/user';
import type { CartItem } from '../types/cart';

// ============================================
// Authentication Events
// ============================================

export interface AuthLoginEvent {
  type: 'auth:login';
  payload: {
    user: User;
    token: string;
  };
}

export interface AuthLogoutEvent {
  type: 'auth:logout';
  payload: {};
}

export interface AuthSessionExpiredEvent {
  type: 'auth:session-expired';
  payload: {};
}

// ============================================
// Cart Events
// ============================================

export interface CartAddEvent {
  type: 'cart:add';
  payload: {
    productId: string;
    quantity: number;
    variantId?: string;
  };
}

export interface CartUpdateEvent {
  type: 'cart:update';
  payload: {
    itemId: string;
    quantity: number;
  };
}

export interface CartRemoveEvent {
  type: 'cart:remove';
  payload: {
    itemId: string;
  };
}

export interface CartClearEvent {
  type: 'cart:clear';
  payload: {};
}

export interface CartSyncEvent {
  type: 'cart:sync';
  payload: {
    items: CartItem[];
    total: number;
  };
}

// ============================================
// Wishlist Events
// ============================================

export interface WishlistAddEvent {
  type: 'wishlist:add';
  payload: {
    productId: string;
  };
}

export interface WishlistRemoveEvent {
  type: 'wishlist:remove';
  payload: {
    productId: string;
  };
}

export interface WishlistSyncEvent {
  type: 'wishlist:sync';
  payload: {
    productIds: string[];
  };
}

// ============================================
// Search Events
// ============================================

export interface SearchFilterEvent {
  type: 'search:filter';
  payload: SearchFilters;
}

export interface SearchClearEvent {
  type: 'search:clear';
  payload: {};
}

// ============================================
// Navigation Events
// ============================================

export interface NavigateEvent {
  type: 'navigate';
  payload: {
    path: string;
    query?: Record<string, string>;
  };
}

// ============================================
// Notification Events
// ============================================

export interface NotificationEvent {
  type: 'notification';
  payload: {
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
}

// ============================================
// Union Type for All Events
// ============================================

export type MFEEvent =
  | AuthLoginEvent
  | AuthLogoutEvent
  | AuthSessionExpiredEvent
  | CartAddEvent
  | CartUpdateEvent
  | CartRemoveEvent
  | CartClearEvent
  | CartSyncEvent
  | WishlistAddEvent
  | WishlistRemoveEvent
  | WishlistSyncEvent
  | SearchFilterEvent
  | SearchClearEvent
  | NavigateEvent
  | NotificationEvent;

export type MFEEventType = MFEEvent['type'];

export type MFEEventPayload<T extends MFEEventType> = Extract<MFEEvent, { type: T }>['payload'];
