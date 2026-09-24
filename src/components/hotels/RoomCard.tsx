'use client';

import React from 'react';
import Image from 'next/image';
import { RoomType } from '@/types';
import { formatCurrency, getImageUrl } from '@/lib/utils';
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
  const mainImage = roomType.images?.[0];
  const imageUrl = mainImage ? getImageUrl(mainImage) : '/images/placeholder-room.jpg';
  const totalPrice = roomType.price_per_night * nights;
  const isAvailable = roomType.available_rooms === undefined || roomType.available_rooms > 0;

  return (
    <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden hover:shadow-card transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
          <Image
            src={imageUrl}
            alt={roomType.name}
            fill
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
                  Up to {roomType.max_guests} guests
                </span>
                <span className="flex items-center gap-1">
                  <IoBedOutline className="text-secondary-400" />
                  {roomType.bed_type}
                </span>
                {roomType.room_size && (
                  <span className="flex items-center gap-1">
                    <FiMaximize className="text-secondary-400" />
                    {roomType.room_size} m²
                  </span>
                )}
              </div>

              <p className="text-sm text-secondary-500 mt-2 line-clamp-2">{roomType.description}</p>

              {/* Amenities */}
              {roomType.amenities && roomType.amenities.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  {roomType.amenities.slice(0, 6).map((amenity) => (
                    <span key={amenity} className="flex items-center gap-1 text-xs text-secondary-500">
                      <FiCheck className="text-success-500" />
                      <span className="capitalize">{amenity.replace('_', ' ')}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Availability */}
              {roomType.available_rooms !== undefined && (
                <p className={`text-xs mt-2 font-medium ${
                  roomType.available_rooms <= 3
                    ? 'text-danger-500'
                    : 'text-success-600'
                }`}>
                  {roomType.available_rooms === 0
                    ? 'No rooms available'
                    : roomType.available_rooms <= 3
                    ? `Only ${roomType.available_rooms} rooms left!`
                    : `${roomType.available_rooms} rooms available`}
                </p>
              )}
            </div>

            {/* Price + Book */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 min-w-[150px]">
              <div className="text-right">
                <p className="text-2xl font-bold text-secondary-900">
                  {formatCurrency(roomType.price_per_night)}
                </p>
                <p className="text-xs text-secondary-500">per night</p>
                {nights > 1 && (
                  <p className="text-sm text-secondary-600 font-medium mt-1">
                    {formatCurrency(totalPrice)} total
                    <span className="text-xs text-secondary-400 block">
                      for {nights} {nights === 1 ? 'night' : 'nights'}
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