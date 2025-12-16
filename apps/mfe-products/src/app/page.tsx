'use client';

import { ProductGrid } from '../components/product-grid';
import { useProducts } from '../hooks/use-product-queries';
import { useRouter } from 'next/navigation';
import { trackProductView } from '../lib/analytics';
import { type Product } from '../lib/api';

export default function ProductsPage() {
  const { data: products = [], isLoading, error, refetch } = useProducts();
  const router = useRouter();

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-gray-600 mt-2">Browse our product catalog</p>
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
