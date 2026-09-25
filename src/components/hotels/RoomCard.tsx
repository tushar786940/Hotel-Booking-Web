// src/components/hotels/RoomCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { RoomType } from '@/types';
import { formatCurrency, getImageUrl, getRoomPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { FiUsers, FiMaximize, FiCheck } from 'react-icons/fi';
import { IoBedOutline } from 'react-icons/io5';

interface RoomCardProps {
  roomType: RoomType;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  onBook?: (roomType: RoomType) => void;
}

export default function RoomCard({ roomType, checkIn, checkOut, nights = 1, onBook }: RoomCardProps) {
  const target = (roomType as any)?.room_type || (roomType as any)?.roomType || roomType;
  const mainImage = target?.images?.[0] || roomType?.images?.[0];
  const imageUrl = getImageUrl(mainImage);
  
  const roomName =
    target?.name ||
    roomType?.name ||
    'Room';

  const price = getRoomPrice(roomType);
  const validNights = Math.max(nights, 1);
  const totalPrice = price * validNights;
  const availableCount = roomType?.available_rooms ?? (roomType as any)?.available_count ?? (roomType as any)?.total_rooms;
  const isAvailable = availableCount === undefined || availableCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden hover:shadow-card transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
          <Image
            src={imageUrl}
            alt={roomName}
            fill
            sizes="(max-width: 768px) 100vw, 288px"
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-secondary-900">{roomName}</h3>
              
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <FiUsers className="text-secondary-400" />
                  Up to {target?.max_guests || roomType?.max_guests || 2} guests
                </span>
                {(target?.bed_type || roomType?.bed_type) && (
                  <span className="flex items-center gap-1">
                    <IoBedOutline className="text-secondary-400" />
                    {target?.bed_type || roomType?.bed_type}
                  </span>
                )}
                {(target?.room_size || roomType?.room_size) && (
                  <span className="flex items-center gap-1">
                    <FiMaximize className="text-secondary-400" />
                    {target?.room_size || roomType?.room_size} m²
                  </span>
                )}
              </div>

              {(target?.description || roomType?.description) && (
                <p className="text-sm text-secondary-500 mt-2 line-clamp-2">
                  {target?.description || roomType?.description}
                </p>
              )}

              {/* Amenities */}
              {(target?.amenities || roomType?.amenities) && Array.isArray(target?.amenities || roomType?.amenities) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  {(target?.amenities || roomType?.amenities).slice(0, 6).map((amenity: any) => (
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
                  availableCount <= 3
                    ? 'text-danger-500'
                    : 'text-success-600'
                }`}>
                  {availableCount === 0
                    ? 'No rooms available'
                    : availableCount <= 3
                    ? `Only ${availableCount} rooms left!`
                    : `${availableCount} rooms available`}
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
                {validNights > 1 && price > 0 && (
                  <p className="text-sm text-secondary-600 font-medium mt-1">
                    {formatCurrency(totalPrice)} total
                    <span className="text-xs text-secondary-400 block">
                      for {validNights} nights
                    </span>
                  </p>
                )}
              </div>

              <Button
                onClick={() => onBook?.(roomType)}
                disabled={!isAvailable}
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