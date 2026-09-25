// src/components/hotels/RoomCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { RoomType } from '@/types';
import { calculatePricing, formatCurrency, getImageUrl, getRoomPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { FiUsers, FiCheck, FiHome } from 'react-icons/fi';

interface RoomCardProps {
  roomType: RoomType;
  /** Number of guests, used to preview the API's extra-guest charge. */
  guests?: number;
  nights?: number;
  onBook?: (roomType: RoomType) => void;
}

export default function RoomCard({ roomType, guests = 1, nights = 1, onBook }: RoomCardProps) {
  const imageUrl = getImageUrl(roomType.cover_image || roomType.images?.[0]);
  const price = getRoomPrice(roomType);
  const validNights = Math.max(nights, 1);
  const pricing = calculatePricing(price, validNights, guests);

  const availableCount = roomType.available_rooms;
  const isAvailable = availableCount === undefined || availableCount > 0;
  const capacity = roomType.capacity || 2;

  return (
    <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden hover:shadow-card transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
          <Image
            src={imageUrl}
            alt={roomType.name}
            fill
            sizes="(max-width: 768px) 100vw, 288px"
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-secondary-900">{roomType.name}</h3>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <FiUsers className="text-secondary-400" />
                  Up to {capacity} {capacity === 1 ? 'guest' : 'guests'}
                </span>
                {roomType.total_rooms ? (
                  <span className="flex items-center gap-1">
                    <FiHome className="text-secondary-400" />
                    {roomType.total_rooms} rooms of this type
                  </span>
                ) : null}
              </div>

              {roomType.description && (
                <p className="text-sm text-secondary-500 mt-2 line-clamp-2">
                  {roomType.description}
                </p>
              )}

              {/* Amenities */}
              {Array.isArray(roomType.amenities) && roomType.amenities.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  {roomType.amenities.slice(0, 6).map((amenity) => (
                    <span key={amenity} className="flex items-center gap-1 text-xs text-secondary-500">
                      <FiCheck className="text-success-500" />
                      <span className="capitalize">{String(amenity).replace(/_/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Availability */}
              {availableCount !== undefined && (
                <p className={`text-xs mt-2 font-medium ${
                  availableCount <= 3 ? 'text-danger-500' : 'text-success-600'
                }`}>
                  {availableCount === 0
                    ? 'No rooms available'
                    : availableCount <= 3
                    ? `Only ${availableCount} ${availableCount === 1 ? 'room' : 'rooms'} left!`
                    : `${availableCount} rooms available`}
                </p>
              )}

              {guests > capacity && (
                <p className="text-xs mt-2 font-medium text-amber-600">
                  This room sleeps {capacity} — pick a larger room type for {guests} guests.
                </p>
              )}
            </div>

            {/* Price + Book */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 min-w-[150px]">
              <div className="text-right">
                <p className="text-2xl font-bold text-secondary-900">
                  {formatCurrency(price)}
                </p>
                <p className="text-xs text-secondary-500">per night</p>
                {price > 0 && (
                  <p className="text-sm text-secondary-600 font-medium mt-1">
                    {formatCurrency(pricing.total)} total
                    <span className="text-xs text-secondary-400 block">
                      {validNights} {validNights === 1 ? 'night' : 'nights'}, incl. taxes
                    </span>
                  </p>
                )}
              </div>

              <Button
                onClick={() => onBook?.(roomType)}
                disabled={!isAvailable || guests > capacity}
                variant={isAvailable ? 'primary' : 'secondary'}
                size="md"
              >
                {isAvailable ? 'Book Now' : 'Sold Out'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
