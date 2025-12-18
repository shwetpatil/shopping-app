'use client';

import { ProductGrid } from '../components/product-grid';
import { useProducts } from '../hooks/use-product-queries';
import { useRouter } from 'next/navigation';
import { trackProductView } from '../lib/analytics';
import { type Product } from '../lib/api';
import { useProductWebSocket } from '../hooks/useProductWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function ProductsPage() {
  const { data: products = [], isLoading, error, refetch } = useProducts();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { onInventoryUpdate, onProductCreated, isConnected } = useProductWebSocket();

  // Subscribe to real-time inventory updates
  useEffect(() => {
    const unsubInventory = onInventoryUpdate((data) => {
      console.log('📦 Inventory update received:', data);
      
      // Update the product in the React Query cache
      queryClient.setQueryData(['products'], (oldProducts: Product[] | undefined) => {
        if (!oldProducts) return oldProducts;
        
        return oldProducts.map((product) =>
          product.id === data.productId
            ? { ...product, stock: data.stock }
            : product
        );
      });
    });

    const unsubCreated = onProductCreated((data) => {
      console.log('🆕 New product created:', data);
      // Refetch products list when a new product is added
      refetch();
    });

    return () => {
      unsubInventory();
      unsubCreated();
    };
  }, [onInventoryUpdate, onProductCreated, queryClient, refetch]);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600 mt-2">Browse our product catalog</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-700 font-medium">Live Updates Active</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-yellow-800 font-medium">⚠️ {error.message || 'Failed to load products'}</p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-sm text-yellow-600 mt-1">
                  Start backend: <code className="bg-yellow-100 px-2 py-0.5 rounded">npm run services:all</code>
                </p>
              )}
            </div>
            <button
              onClick={() => refetch()}
              className="text-sm text-yellow-700 hover:text-yellow-900 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <ProductGrid 
        products={products}
        loading={isLoading}
        onProductClick={(product: Product) => {
          // Track analytics
          trackProductView({
            productId: product.id,
            productName: product.name,
            category: product.category,
            price: product.price,
          });
          
          // Navigate to detail page
          router.push(`/products/${product.id}`);
        }}
      />

      {/* React Query DevTools info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">🔍 React Query Status</h3>
          <ul className="text-sm space-y-1">
            <li>Products loaded: {products.length}</li>
            <li>Loading: {isLoading ? 'Yes' : 'No'}</li>
            <li>Error: {error ? error.message : 'None'}</li>
            <li className="text-xs text-gray-600 mt-2">Open DevTools (bottom right) to see query cache</li>
          </ul>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">🎯 Module Info</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Port: 3004</li>
          <li>✅ Exposed: ProductGrid, ProductCard, ProductDetail</li>
          <li>✅ Team: Commerce Team</li>
          <li>✅ Deployable: Independently</li>
        </ul>
      </div>
    </div>
  );
}
