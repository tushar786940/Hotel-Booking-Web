'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Booking } from '@/types';
import { formatCurrency, formatDate, getImageUrl, getBookingPriceBreakdown } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { FiCalendar, FiMapPin, FiUsers } from 'react-icons/fi';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const hotel = booking.hotel;
  const roomType = booking.room_type;
  const imageUrl = hotel?.images?.[0] ? getImageUrl(hotel.images[0]) : '/images/placeholder-hotel.jpg';
  const price = getBookingPriceBreakdown(booking);

  return (
    <Link href={`/bookings/${booking.id}`}>
      <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden hover:shadow-card transition-shadow">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
            <Image
              src={imageUrl}
              alt={hotel?.name || 'Hotel'}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-secondary-900">{hotel?.name}</h3>
                {roomType && (
                  <p className="text-sm text-secondary-500">{roomType.name}</p>
                )}
              </div>
              <Badge status={booking.status} />
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-secondary-500">
              <span className="flex items-center gap-1.5">
                <FiMapPin className="text-secondary-400" />
                {hotel?.city}, {hotel?.country}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="text-secondary-400" />
                {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
              </span>
              <span className="flex items-center gap-1.5">
                <FiUsers className="text-secondary-400" />
                {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-secondary-100">
              <div>
                <span className="text-xs text-secondary-400">Booking #</span>
                <span className="text-sm font-mono font-medium text-secondary-700 ml-1">
                  {booking.booking_number}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-secondary-900">
                  {formatCurrency(price.total)}
                </span>
                <span className="text-xs text-secondary-500 block">
                  {price.nights} {price.nights === 1 ? 'night' : 'nights'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}