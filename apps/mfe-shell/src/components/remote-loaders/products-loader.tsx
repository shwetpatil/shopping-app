'use client';

// This file will load remote Products MFE components
// For now, we'll use placeholders until Module Federation is configured

export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="aspect-square bg-gray-200 rounded mb-4" />
          <h3 className="font-semibold mb-2">Product {i}</h3>
          <p className="text-primary-600 font-bold">$99.99</p>
          <p className="text-xs text-gray-500 mt-2">
            🔌 Products MFE (Port 3004)
          </p>
        </div>
      ))}
    </div>
  );
}

export function ProductCard() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600">Product Card Component</p>
    </div>
  );
}
