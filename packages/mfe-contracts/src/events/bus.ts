/**
 * Event Bus for cross-MFE communication
 * Enables pub-sub pattern between microfrontends
 */

import type { MFEEvent, MFEEventType, MFEEventPayload } from './types';

type EventHandler<T extends MFEEventType> = (payload: MFEEventPayload<T>) => void;

class EventBus {
  private listeners: Map<MFEEventType, Set<EventHandler<any>>> = new Map();
  private eventHistory: MFEEvent[] = [];
  private maxHistorySize = 50;

  /**
   * Publish an event to all subscribers
   */
  publish<T extends MFEEventType>(type: T, payload: MFEEventPayload<T>): void {
    const event = { type, payload } as MFEEvent;

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify subscribers
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] Error in handler for "${type}":`, error);
        }
      });
    }

    // Also emit as DOM event for cross-window/iframe communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mfe:event', {
          detail: event,
          bubbles: true,
        })
      );
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] Event published: ${type}`, payload);
    }
  }

  /**
   * Subscribe to an event type
   * Returns unsubscribe function
   */
  subscribe<T extends MFEEventType>(
    type: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Subscribe to multiple event types at once
   */
  subscribeMultiple(
    subscriptions: Array<{
      type: MFEEventType;
      handler: EventHandler<any>;
    }>
  ): () => void {
    const unsubscribers = subscriptions.map(({ type, handler }) =>
      this.subscribe(type, handler)
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Get event history for debugging
   */
  getHistory(): readonly MFEEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get all active subscriptions (for debugging)
   */
  getActiveSubscriptions(): Map<MFEEventType, number> {
    const counts = new Map<MFEEventType, number>();
    this.listeners.forEach((handlers, type) => {
      counts.set(type, handlers.size);
    });
    return counts;
  }

  /**
   * Clear all subscriptions (useful for cleanup in tests)
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }
}

// Singleton instance
export const mfeEventBus = new EventBus();

// Export for testing
export { EventBus };
