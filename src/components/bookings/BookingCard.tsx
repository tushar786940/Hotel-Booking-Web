'use client';

import React from 'react';
import Link from 'next/link';
import { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { FiCalendar, FiMapPin, FiUsers, FiHome } from 'react-icons/fi';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  // BookingResource returns a trimmed hotel ({id, name, city}) and a room
  // ({room_number, room_type, floor, price_per_night}) — no images.
  const { hotel, room } = booking;

  return (
    <Link href={`/bookings/${booking.id}`}>
      <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden hover:shadow-card transition-shadow">
        <div className="flex flex-col sm:flex-row">
          {/* Hotel initial tile */}
          <div className="relative w-full sm:w-40 h-24 sm:h-auto flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/90">
              {hotel?.name?.charAt(0)?.toUpperCase() || 'H'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-secondary-900">{hotel?.name}</h3>
                {room?.room_type && (
                  <p className="text-sm text-secondary-500">
                    {room.room_type}
                    {room.room_number ? ` · Room ${room.room_number}` : ''}
                  </p>
                )}
              </div>
              <Badge status={booking.status} />
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-secondary-500">
              <span className="flex items-center gap-1.5">
                <FiMapPin className="text-secondary-400" />
                {hotel?.city}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="text-secondary-400" />
                {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
              </span>
              <span className="flex items-center gap-1.5">
                <FiUsers className="text-secondary-400" />
                {booking.guests_count} {booking.guests_count === 1 ? 'Guest' : 'Guests'}
              </span>
              {room?.floor ? (
                <span className="flex items-center gap-1.5">
                  <FiHome className="text-secondary-400" />
                  Floor {room.floor}
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-secondary-100">
              <div>
                <span className="text-xs text-secondary-400">Reference</span>
                <span className="text-sm font-mono font-medium text-secondary-700 ml-1">
                  {booking.booking_reference}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-secondary-900">
                  {formatCurrency(booking.total_price)}
                </span>
                <span className="text-xs text-secondary-500 block">
                  {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
