import { WishlistButton } from '../components/wishlist-button';

export default function WishlistMFEPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Wishlist MFE - Standalone Mode</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">WishlistButton Component (Icon Variant)</h2>
        <WishlistButton productId="test-1" variant="icon" />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">WishlistButton Component (Button Variant)</h2>
        <WishlistButton productId="test-2" variant="button" />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">🎯 Module Info</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Port: 3002</li>
          <li>✅ Exposed: WishlistButton, WishlistPage</li>
          <li>✅ Team: Engagement Team</li>
          <li>✅ Deployable: Independently</li>
        </ul>
      </div>
    </div>
  );
}
