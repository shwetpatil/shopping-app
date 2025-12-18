'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_WS || 'http://localhost:4002';

interface InventoryUpdate {
  productId: string;
  stock: number;
  timestamp: string;
}

interface ProductUpdate {
  productId: string;
  updates: any;
  timestamp: string;
}

type InventoryUpdateCallback = (data: InventoryUpdate) => void;
type ProductUpdateCallback = (data: ProductUpdate) => void;
type GenericEventCallback = (data: any) => void;

export const useProductWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected to Product Service');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const subscribe = useCallback((event: string, handler: Function) => {
    if (!socketRef.current) return;

    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)?.add(handler);

    socketRef.current.on(event, handler as any);
  }, []);

  const unsubscribe = useCallback((event: string, handler: Function) => {
    if (!socketRef.current) return;

    handlersRef.current.get(event)?.delete(handler);
    socketRef.current.off(event, handler as any);
  }, []);

  const subscribeToProduct = useCallback((productId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:product', productId);
    }
  }, []);

  const unsubscribeFromProduct = useCallback((productId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe:product', productId);
    }
  }, []);

  const onInventoryUpdate = useCallback((callback: InventoryUpdateCallback) => {
    subscribe('inventory:update', callback);
    return () => unsubscribe('inventory:update', callback);
  }, [subscribe, unsubscribe]);

  const onProductUpdate = useCallback((callback: ProductUpdateCallback) => {
    subscribe('product:update', callback);
    return () => unsubscribe('product:update', callback);
  }, [subscribe, unsubscribe]);

  const onProductCreated = useCallback((callback: GenericEventCallback) => {
    subscribe('product:created', callback);
    return () => unsubscribe('product:created', callback);
  }, [subscribe, unsubscribe]);

  return {
    subscribeToProduct,
    unsubscribeFromProduct,
    onInventoryUpdate,
    onProductUpdate,
    onProductCreated,
    isConnected: socketRef.current?.connected ?? false,
  };
};
