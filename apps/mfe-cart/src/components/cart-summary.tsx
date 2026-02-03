'use client';

import { Trash2, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { CartSummaryProps } from '@shopping-app/mfe-contracts';
import { useMFEEvent, useMFEPublish } from '@shopping-app/mfe-contracts';

const sampleCartItems = [
  { id: '1', name: 'Wireless Headphones', price: 79.99, quantity: 1, image: '/img1.jpg' },
  { id: '2', name: 'Smart Watch', price: 199.99, quantity: 2, image: '/img2.jpg' },
];

type LocalCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export function CartSummary({ variant = 'full', showItems = true, onCheckout, onViewCart, className }: CartSummaryProps) {
  const [cartItems, setCartItems] = useState<LocalCartItem[]>(sampleCartItems);
  const publishCartSync = useMFEPublish('cart:sync');

  // Subscribe to cart:add events
  useMFEEvent('cart:add', (payload) => {
    console.log('Cart: Received cart:add event', payload);
    // Check if item already exists
    const existingItem = cartItems.find(item => item.id === payload.productId);
    if (existingItem) {
      setCartItems(prev => 
        prev.map(item => 
          item.id === payload.productId 
            ? { ...item, quantity: item.quantity + payload.quantity }
            : item
        )
      );
    } else {
      // Add new item (in real app, would fetch product details)
      const newItem: LocalCartItem = {
        id: payload.productId,
        name: 'New Product',
        price: 99.99,
        quantity: payload.quantity,
        image: '/placeholder.jpg'
      };
      setCartItems(prev => [...prev, newItem]);
    }
  });

  // Sync cart state whenever it changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    publishCartSync({ items: cartItems as any, total });
  }, [cartItems, publishCartSync]);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(prev => 
      prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (variant === 'icon-only') {
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return (
      <button onClick={onViewCart} className={`relative ${className || ''}`}>
        <span className="text-2xl">🛒</span>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`rounded-lg border bg-white p-6 ${className || ''}`}>
      <h3 className="mb-4 text-xl font-bold">Shopping Cart</h3>

      {/* Cart Items */}
      {showItems && variant === 'full' && (
      <div className="space-y-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 border-b pb-4">
            <div className="h-20 w-20 rounded bg-gray-200" />
            <div className="flex-1">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-blue-600 font-bold">${item.price.toFixed(2)}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1));
                  }}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateQuantity(item.id, item.quantity + 1);
                  }}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveItem(item.id);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      )}

      {/* Summary */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
