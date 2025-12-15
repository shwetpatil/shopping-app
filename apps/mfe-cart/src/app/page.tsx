import { CartSummary } from '../components/cart-summary';
import { CheckoutFlow } from '../components/checkout-flow';

export default function CartMFEPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Cart & Checkout MFE - Standalone Mode</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">CartSummary Component</h2>
          <CartSummary />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">CheckoutFlow Component</h2>
          <CheckoutFlow />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">🎯 Module Info</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Port: 3005</li>
          <li>✅ Exposed: CartSummary, CheckoutFlow, CartPage</li>
          <li>✅ Team: Commerce Team</li>
          <li>✅ Deployable: Independently</li>
        </ul>
      </div>
    </div>
  );
}
