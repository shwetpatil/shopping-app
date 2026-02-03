'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { SearchBarProps } from '@shopping-app/mfe-contracts';
import { useMFEPublish } from '@shopping-app/mfe-contracts';

export function SearchBar({ onSearch, placeholder, initialQuery, className }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const publishSearchFilter = useMFEPublish('search:filter');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const filters = { query: searchQuery.trim() };
      
      // Publish search:filter event
      publishSearchFilter(filters);
      
      // Also call callback if provided
      if (onSearch) {
        onSearch(filters);
      }
    }
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSearch} className={`relative flex items-center gap-2 ${className || ''}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder || 'Search products...'}
          className="w-full rounded-lg border py-2 pl-10 pr-10 focus:border-blue-600 focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}
