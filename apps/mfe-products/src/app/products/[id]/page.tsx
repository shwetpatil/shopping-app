'use client';

import { useProduct } from '@/hooks/use-product-queries';
import { useMFEPublish } from '@shopping-app/mfe-contracts';
import Image from 'next/image';
import { ArrowLeftIcon, ShoppingCartIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useState } from 'react';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { data: product, isLoading, error } = useProduct(Number(params.id));
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartMessage, setCartMessage] = useState('');
  const publishCartAdd = useMFEPublish('cart:add');

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = product.imageUrl ? [product.imageUrl] : [];
  
  const handleAddToCart = () => {
    // Publish cart:add event to Cart MFE
    publishCartAdd({
      productId: product.id,
      quantity,
    });

    // Show success message
    setCartMessage(`✅ Added ${quantity} ${product.name} to cart!`);
    
    // Clear message after 3 seconds
    setTimeout(() => setCartMessage(''), 3000);
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    // eslint-disable-next-line no-console
    console.log('Wishlist toggled:', !isWishlisted);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message */}
      {cartMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {cartMessage}
        </div>
      )}
      
      {/* Back Button */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden bg-white border border-gray-200">
            <Image
              src={images[selectedImage] || '/placeholder-product.png'}
              alt={product.name}
              fill
              className="object-contain p-4"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square relative rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category Badge */}
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {product.category}
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.rating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-lg font-medium text-gray-700">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Quantity:
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              Add to Cart
            </button>
            
            <button
              onClick={handleWishlistToggle}
              className={`p-4 border-2 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                isWishlisted
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? (
                <HeartIconSolid className="w-6 h-6" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleShare}
              className="p-4 border-2 border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Share product"
            >
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Product Details */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Category:</dt>
                <dd className="font-medium text-gray-900">{product.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Product ID:</dt>
                <dd className="font-medium text-gray-900">#{product.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Availability:</dt>
                <dd className="font-medium text-green-600">In Stock</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Reviews Section Placeholder */}
      <div className="mt-16 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">Reviews feature coming soon!</p>
        </div>
      </div>
    </div>
  );
}
