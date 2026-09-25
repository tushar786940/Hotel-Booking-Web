'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CancelBookingDialog from '@/components/bookings/CancelBookingDialog';
import { FiCalendar, FiMapPin, FiUsers, FiHome, FiX } from 'react-icons/fi';

interface BookingCardProps {
  booking: Booking;
  /**
   * Called with the cancelled booking. When omitted the card shows no cancel
   * action — the parent owns the list, so it has to be able to refresh it.
   */
  onCancelled?: (booking: Booking) => void;
}

export default function BookingCard({ booking, onCancelled }: BookingCardProps) {
  // BookingResource returns a trimmed hotel ({id, name, city}) and a room
  // ({room_number, room_type, floor, price_per_night}) — no images.
  const { hotel, room } = booking;
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // `is_cancellable` is computed by the API (Booking::isCancellable).
  const canCancel = Boolean(onCancelled) && booking.is_cancellable;

  return (
    <>
      {/*
        The whole card used to be one <Link>. A <button> inside an <a> is
        invalid HTML and would navigate on click, so the link is now an overlay
        that fills the card and the actions sit above it on the z-axis.
      */}
      <div className="relative bg-white rounded-2xl border border-secondary-100 overflow-hidden hover:shadow-card transition-shadow">
        <Link
          href={`/bookings/${booking.id}`}
          className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={`View booking ${booking.booking_reference}`}
        />

        <div className="flex flex-col sm:flex-row pointer-events-none">
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

            {canCancel && (
              // pointer-events re-enabled so this sits above the link overlay.
              <div className="flex justify-end mt-3 pointer-events-auto relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<FiX />}
                  onClick={() => setShowCancelDialog(true)}
                  className="text-danger-600 hover:bg-danger-50"
                >
                  Cancel booking
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {onCancelled && showCancelDialog && (
        <CancelBookingDialog
          booking={booking}
          onClose={() => setShowCancelDialog(false)}
          onCancelled={onCancelled}
        />
      )}
    </>
  );
}
