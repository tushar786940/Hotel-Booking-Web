'use client';

import React, { useEffect, useState } from 'react';
import { Hotel, HotelReview } from '@/types';
import { manageApi, reviewsApi } from '@/lib/api';
import { formatMaybeDate } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FiStar } from 'react-icons/fi';

interface ReviewWithHotel extends HotelReview {
  hotelName: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Reviews are public per hotel: GET /hotels/{hotel}/reviews
        const hotelsRes = await manageApi.listHotels();
        const hotels: Hotel[] = hotelsRes.data?.data ?? [];

        const responses = await Promise.allSettled(
          hotels.map((hotel) => reviewsApi.listByHotel(hotel.id)),
        );

        const all: ReviewWithHotel[] = responses.flatMap((result, index) => {
          if (result.status !== 'fulfilled') return [];
          const data: HotelReview[] = result.value.data?.data ?? [];
          return data.map((review) => ({
            ...review,
            hotelName: hotels[index]?.name ?? '',
          }));
        });

        setReviews(all);
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
      <p className="text-secondary-500 mb-6">What guests said about your hotels</p>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={`${review.hotelName}-${review.id}`} className="bg-white rounded-2xl border border-secondary-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-secondary-400">
                  {formatMaybeDate(review.created_at)}
                </span>
              </div>
              <p className="text-sm text-secondary-600 mt-1">{review.comment}</p>
              <p className="text-xs text-secondary-400 mt-2">
                By {review.user || 'Guest'}
                {review.hotelName ? ` • ${review.hotelName}` : ''}
              </p>
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
