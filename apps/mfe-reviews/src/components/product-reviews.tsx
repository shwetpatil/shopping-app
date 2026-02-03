'use client';


// eslint-disable-next-line no-console
import { Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import type { ProductReviewsProps } from '@shopping-app/mfe-contracts';

export function ProductReviews({ 
  productId,
  allowWrite = true,
  className 
}: ProductReviewsProps) {
  // Mock data
  const averageRating = 4.5;
  const totalReviews = 128;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // eslint-disable-next-line no-console
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      console.log('Review submitted:', { rating, comment, productId });
      setRating(0);
      setComment('');
    }
  };

  return (
    <div className={`space-y-8 ${className || ''}`}>
      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
          <div>
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">{totalReviews} reviews</p>
          </div>
        </div>
      </div>

      {/* Write Review Form */}
      {allowWrite && (
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full rounded-lg border p-3 focus:border-blue-600 focus:outline-none"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Submit Review
          </button>
        </form>
      </div>
      )}

      {/* Sample Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="font-semibold">John Doe</p>
              <p className="text-sm text-gray-600">2 days ago</p>
            </div>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
              <ThumbsUp className="h-4 w-4" />
              <span>12</span>
            </button>
          </div>
          <p className="text-gray-700">
            Great product! Exceeded my expectations. Highly recommended.
          </p>
        </div>
      </div>
    </div>
  );
}
