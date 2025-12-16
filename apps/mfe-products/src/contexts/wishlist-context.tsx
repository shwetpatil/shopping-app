'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trackAddToWishlist } from '@/lib/analytics';

interface WishlistContextValue {
  wishlist: string[];
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string, productName: string, category: string, price: number) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'product-wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse wishlist from localStorage:', error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const addToWishlist = (productId: string, productName: string, category: string, price: number) => {
    if (!wishlist.includes(productId)) {
      setWishlist((prev) => [...prev, productId]);
      
      // Track analytics
      trackAddToWishlist({
        productId,
        productName,
        category,
        price,
      });
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
