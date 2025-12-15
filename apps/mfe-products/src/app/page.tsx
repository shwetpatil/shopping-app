import { ProductGrid } from '../components/product-grid';
import { ProductCard } from '../components/product-card';

export default function ProductsMFEPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Products MFE - Standalone Mode</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ProductCard Component</h2>
        <div className="max-w-sm">
          <ProductCard 
            product={{
              id: '1',
              name: 'Sample Product',
              price: 99.99,
              imageUrl: '/placeholder.jpg',
              rating: 4.5,
              reviewCount: 128
            }}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ProductGrid Component</h2>
        <ProductGrid />
      </div>

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
