'use client';

// This file will load remote Search MFE components
// For now, we'll use placeholders until Module Federation is configured

export function SearchBar() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Search products... (Search MFE - Port 3001)"
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
          Search
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        🔌 This component will be loaded from Search MFE at runtime
      </p>
    </div>
  );
}

export function FilterPanel() {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-bold mb-4">Filters (Search MFE)</h3>
      <p className="text-sm text-gray-600">
        Filter panel loaded from remote module
      </p>
    </div>
  );
}
