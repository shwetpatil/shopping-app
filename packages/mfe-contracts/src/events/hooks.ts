/**
 * React hooks for event bus integration
 * Makes it easy to use events in React components
 */

import { useEffect, useCallback, useRef } from 'react';
import { mfeEventBus } from './bus';
import type { MFEEventType, MFEEventPayload } from './types';

/**
 * Hook to subscribe to a specific event type
 * Automatically unsubscribes on unmount
 */
export function useMFEEvent<T extends MFEEventType>(
  type: T,
  handler: (payload: MFEEventPayload<T>) => void,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = mfeEventBus.subscribe(type, (payload) => {
      handlerRef.current(payload);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}

/**
 * Hook to publish events
 * Returns a stable publish function
 */
export function useMFEPublish<T extends MFEEventType>(
  type: T
): (payload: MFEEventPayload<T>) => void {
  return useCallback(
    (payload: MFEEventPayload<T>) => {
      mfeEventBus.publish(type, payload);
    },
    [type]
  );
}

/**
 * Hook to get a generic publish function
 * Useful when you need to publish different event types
 */
export function useMFEPublisher(): <T extends MFEEventType>(
  type: T,
  payload: MFEEventPayload<T>
) => void {
  return useCallback(<T extends MFEEventType>(
    type: T,
    payload: MFEEventPayload<T>
  ) => {
    mfeEventBus.publish(type, payload);
  }, []);
}

/**
 * Hook to subscribe to multiple events
 */
export function useMFEEvents(
  subscriptions: Array<{
    type: MFEEventType;
    handler: (payload: any) => void;
  }>
): void {
  useEffect(() => {
    const unsubscribe = mfeEventBus.subscribeMultiple(subscriptions);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Debug hook to log all events (for development)
 */
export function useMFEEventLogger(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') {
      return;
    }

    const handler = (event: CustomEvent) => {
      console.log('[MFE Event]', event.detail);
    };

    window.addEventListener('mfe:event', handler as EventListener);
    return () => {
      window.removeEventListener('mfe:event', handler as EventListener);
    };
  }, [enabled]);
}
