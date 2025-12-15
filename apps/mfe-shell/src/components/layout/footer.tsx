import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-gray-600 hover:text-primary-600">All Products</Link></li>
              <li><Link href="/categories" className="text-gray-600 hover:text-primary-600">Categories</Link></li>
              <li><Link href="/deals" className="text-gray-600 hover:text-primary-600">Deals</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-gray-600 hover:text-primary-600">My Account</Link></li>
              <li><Link href="/dashboard/orders" className="text-gray-600 hover:text-primary-600">Orders</Link></li>
              <li><Link href="/wishlist" className="text-gray-600 hover:text-primary-600">Wishlist</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-gray-600 hover:text-primary-600">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-primary-600">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-600 hover:text-primary-600">Shipping Info</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Architecture</h3>
            <p className="text-sm text-gray-600 mb-2">
              Built with Microfrontend Architecture
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Independent deployment</li>
              <li>✅ Team autonomy</li>
              <li>✅ Scalable architecture</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2025 Shopping App MFE. Built for B2B scalability.</p>
        </div>
      </div>
    </footer>
  );
}
