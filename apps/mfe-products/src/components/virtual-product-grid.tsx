'use client';

import { List } from 'react-window';
import { ProductCard } from './product-card';
import { useEffect, useState, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
}

interface VirtualProductGridProps {
  products: Product[];
  onProductClick?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

/**
 * VirtualProductGrid - Efficiently renders large product lists using react-window
 * Only renders visible items, greatly improving performance for lists with 1000+ items
 */
export function VirtualProductGrid({ 
  products, 
  onProductClick: _onProductClick,
  onAddToCart 
}: VirtualProductGridProps) {
  const [dimensions, setDimensions] = useState({ width: 1024, height: 600 });
  const [isClient, setIsClient] = useState(false);
  
  // Calculate responsive column count based on screen width
  const getColumnCount = useCallback((width: number) => {
    if (width >= 1280) return 4; // xl: 4 columns
    if (width >= 1024) return 3; // lg: 3 columns
    if (width >= 768) return 2;  // md: 2 columns
    return 1;                     // sm: 1 column
  }, []);
  
  useEffect(() => {
    setIsClient(true);
    
    const updateDimensions = () => {
      const width = Math.max(400, window.innerWidth - 48);
      const height = Math.max(400, window.innerHeight - 200);
      setDimensions({ width, height });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  if (!isClient) {
    return <div className="w-full py-12 text-center text-gray-500">Loading...</div>;
  }
  
  if (!products || products.length === 0) {
    return <div className="w-full py-12 text-center text-gray-500">No products available</div>;
  }

  const columnCount = getColumnCount(dimensions.width);
  
  // Group products into rows
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += columnCount) {
    rows.push(products.slice(i, i + columnCount));
  }

  if (rows.length === 0) {
    return <div className="w-full py-12 text-center text-gray-500">No products available</div>;
  }
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowProducts = rows[index];
    
    if (!rowProducts) {
      return null;
    }
    
    return (
      <div style={style} className="flex gap-6 px-2">
        {rowProducts.map((product) => (
          <div key={product.id} style={{ flex: `0 0 calc(100% / ${columnCount} - ${(columnCount - 1) * 24 / columnCount}px)` }}>
            <ProductCard 
              product={product}
              onAddToCart={(e, productId) => {
                e.stopPropagation();
                onAddToCart?.(productId);
              }}
            />
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="w-full" style={{ height: dimensions.height }}>
      <List
        height={dimensions.height}
        itemCount={rows.length}
        itemSize={420}
        width={dimensions.width}
      >
        {/* @ts-expect-error - react-window children typing issue */}
        {Row}
      </List>
    </div>
  );
}
