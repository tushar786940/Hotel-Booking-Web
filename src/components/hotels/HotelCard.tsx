'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Hotel } from '@/types';
import { formatCurrency, getHotelImage, getHotelMinPrice, cn } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import { FiMapPin, FiStar } from 'react-icons/fi';

interface HotelCardProps {
  hotel: Hotel;
  className?: string;
}

export default function HotelCard({ hotel, className }: HotelCardProps) {
  const imageUrl = getHotelImage(hotel);
  const minPrice = getHotelMinPrice(hotel);
  const reviewsCount = hotel.reviews_count ?? 0;

  return (
    <Link href={`/hotels/${hotel.slug}`} className={cn('group block', className)}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src={imageUrl}
            alt={hotel.name || 'Hotel'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Star rating badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1">
            <FiStar className="text-amber-500 text-xs fill-amber-500" />
            <span className="text-xs font-semibold text-secondary-800">
              {hotel.star_rating || 3}-Star
            </span>
          </div>

          {/* Price Badge */}
          {minPrice > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs text-secondary-500">from </span>
              <span className="text-lg font-bold text-primary-700">
                {formatCurrency(minPrice)}
              </span>
              <span className="text-xs text-secondary-500">/night</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5 text-secondary-500">
            <FiMapPin className="text-xs flex-shrink-0" />
            <span className="text-sm line-clamp-1">{hotel.city}, {hotel.country}</span>
          </div>

          {/* Rating */}
          {hotel.average_rating > 0 ? (
            <div className="flex items-center gap-2 mt-3">
              <StarRating rating={hotel.average_rating} size="sm" />
              <span className="text-sm text-secondary-500">
                ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : null}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hotel.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="px-2 py-0.5 bg-secondary-50 text-secondary-600 text-xs rounded-md capitalize"
                >
                  {String(amenity).replace(/_/g, ' ')}
                </span>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="px-2 py-0.5 text-primary-600 text-xs font-medium">
                  +{hotel.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {hotel.description && (
            <p className="text-sm text-secondary-500 mt-3 line-clamp-2 flex-1">
              {hotel.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
