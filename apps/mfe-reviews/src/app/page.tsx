import { ProductReviews } from '../components/product-reviews';

export default function ReviewsMFEPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Reviews MFE - Standalone Mode</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ProductReviews Component</h2>
        <ProductReviews productId="test-product-1" />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">🎯 Module Info</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Port: 3003</li>
          <li>✅ Exposed: ProductReviews, ReviewForm</li>
          <li>✅ Team: Engagement Team</li>
          <li>✅ Deployable: Independently</li>
        </ul>
      </div>
    </div>
  );
}
