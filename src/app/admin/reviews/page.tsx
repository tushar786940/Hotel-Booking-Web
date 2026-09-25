'use client';

import React, { useEffect, useState } from 'react';
import { Review } from '@/types';
import { hotelsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FiStar } from 'react-icons/fi';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch reviews from all hotels (simplified)
    const fetchReviews = async () => {
      try {
        const hotelsRes = await hotelsApi.list({ per_page: 5 });
        const hotels = hotelsRes.data?.data || [];
        const allReviews: Review[] = [];

        for (const hotel of hotels.slice(0, 3)) {
          try {
            const res = await hotelsApi.getReviews(hotel.id);
            const data = res.data?.data || res.data;
            if (Array.isArray(data)) {
              allReviews.push(...data);
            }
          } catch {}
        }

        setReviews(allReviews);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-2">Reviews</h1>
      <p className="text-secondary-500 mb-6">Moderate guest reviews</p>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-secondary-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-secondary-400">{formatDate(review.created_at)}</span>
                  </div>
                  <h4 className="font-medium text-secondary-900">{review.title}</h4>
                  <p className="text-sm text-secondary-600 mt-1">{review.comment}</p>
                  <p className="text-xs text-secondary-400 mt-2">
                    By {review.user?.name || 'Guest'} • Hotel #{review.hotel_id}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-secondary-100">
          <FiStar className="text-4xl text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No reviews yet</p>
        </div>
      )}
    </div>
  );
}