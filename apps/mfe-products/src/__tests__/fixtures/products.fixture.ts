/**
 * Test fixtures for products
 * Used in tests and development when backend is unavailable
 * Contains 120+ products across multiple categories for virtual scrolling testing
 */

import type { Product } from '../../lib/api';

const CATEGORIES = ['Electronics', 'Accessories', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Beauty'];
const PRODUCT_NAMES = [
  'Wireless Headphones', 'Smart Watch', 'Laptop Stand', 'USB-C Hub', 'Mechanical Keyboard', 'Wireless Mouse',
  'Monitor Lamp', 'Desk Organizer', 'Phone Case', 'Screen Protector', 'Charging Cable', 'Power Bank',
  'Portable Speaker', 'Webcam 4K', 'Microphone', 'Desk Mat', 'Cooling Pad', 'External SSD',
  'USB Hub', 'Wireless Charger', 'Phone Mount', 'Cable Organizer', 'Mouse Pad', 'Keyboard Case',
  'Laptop Bag', 'Phone Holder', 'Desk Chair', 'Standing Desk', 'Monitor Arm', 'Desk Lamp',
  'T-Shirt', 'Hoodie', 'Jeans', 'Shoes', 'Socks', 'Hat', 'Jacket', 'Shorts', 'Pants', 'Belt',
  'Pillowcase', 'Bed Sheet', 'Blanket', 'Towel', 'Bath Mat', 'Plant Pot', 'Wall Clock', 'Mirror',
  'Yoga Mat', 'Dumbbells', 'Water Bottle', 'Sports Watch', 'Running Shoes', 'Exercise Band',
  'Notebook', 'Pen Set', 'Desk Calendar', 'Book Light', 'Magazine Holder', 'Shampoo', 'Face Cream',
  'Lip Balm', 'Hand Lotion', 'Sunscreen', 'Perfume', 'Deodorant', 'Body Wash', 'Toothbrush',
];

const DESCRIPTIONS = [
  'Premium quality product with excellent performance',
  'High-end design with advanced features',
  'Eco-friendly and sustainable product',
  'Perfect for professionals and enthusiasts',
  'Best-selling item with amazing reviews',
  'Limited edition exclusive product',
  'Affordable yet high-quality option',
  'Ergonomic design for comfort',
  'Wireless technology for convenience',
  'Portable and lightweight solution',
  'Professional-grade equipment',
  'Perfect gift for any occasion',
  'Latest technology innovation',
  'Durable and long-lasting',
  'Customer favorite product',
];

const IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1587394710636-e94f2d4e7d5a?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
];

export const mockProducts: Product[] = Array.from({ length: 125 }, (_, idx) => {
  const id = (idx + 1).toString();
  const nameIndex = idx % PRODUCT_NAMES.length;
  const categoryIndex = idx % CATEGORIES.length;
  const imageIndex = idx % IMAGES.length;
  const descIndex = idx % DESCRIPTIONS.length;

  return {
    id,
    name: `${PRODUCT_NAMES[nameIndex]} ${idx > PRODUCT_NAMES.length - 1 ? `v${Math.floor(idx / PRODUCT_NAMES.length)}` : ''}`.trim(),
    slug: `product-${id}`,
    description: `${DESCRIPTIONS[descIndex]}. High quality and great value for money.`,
    price: Math.round((Math.random() * 200 + 10) * 100) / 100,
    currency: 'USD',
    imageUrl: IMAGES[imageIndex],
    category: CATEGORIES[categoryIndex],
    categoryId: `cat-${categoryIndex + 1}`,
    stock: Math.floor(Math.random() * 150) + 5,
    inStock: Math.random() > 0.1,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    reviewCount: Math.floor(Math.random() * 500) + 10,
    createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    updatedAt: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
  };
});
