'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// TODO: Import Product type from shared types package
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'shopping-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Listen for addToCart events from other MFEs
  useEffect(() => {
    const handleAddToCartEvent = (event: CustomEvent) => {
      const { product, quantity = 1 } = event.detail;
      addToCart(product, quantity);
    };

    window.addEventListener('addToCart' as any, handleAddToCartEvent);
    
    return () => {
      window.removeEventListener('addToCart' as any, handleAddToCartEvent);
    };
  }, []);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      
      if (existing) {
        // Update quantity if already in cart
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      // Add new item
      return [...prev, { product, quantity }];
    });

    // Track analytics
    // TODO: Import analytics from shared package
    // eslint-disable-next-line no-console
    console.log('📊 Cart: Product added', {
      productId: product.id,
      productName: product.name,
      quantity,
    });

    // Emit event for other MFEs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: { action: 'add', productId: product.id, quantity }
    }));
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    
    // Emit event for other MFEs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: { action: 'remove', productId }
    }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    
    // Emit event for other MFEs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: { action: 'update', productId, quantity }
    }));
  };

  const clearCart = () => {
    setItems([]);
    
    // Emit event for other MFEs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: { action: 'clear' }
    }));
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
