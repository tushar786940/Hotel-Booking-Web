'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoomType, Hotel } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  bookingsApi,
  getApiErrorMessage,
  isFutureDate,
  isNoRoomsAvailableError,
} from '@/lib/api';
import {
  calculatePricing,
  formatCurrency,
  calculateNights,
  getRoomPrice,
  getRoomCapacity,
  guestOptions,
  parseGuests,
} from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { FiCalendar, FiUsers, FiCreditCard, FiAlertCircle } from 'react-icons/fi';

interface BookingFormProps {
  hotel: Hotel;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  /**
   * Controlled from the page so this picker and the "check availability"
   * picker above it can never drift apart.
   */
  guests: number;
  onGuestsChange?: (guests: number) => void;
  onClose?: () => void;
  /**
   * Called when the API rejects the booking because the room type is fully
   * booked, so the parent can refresh availability and flip the card to
   * "Sold Out" instead of leaving a button that cannot succeed.
   */
  onSoldOut?: () => void;
}

export default function BookingForm({
  hotel,
  roomType,
  checkIn,
  checkOut,
  guests,
  onGuestsChange,
  onClose,
  onSoldOut,
}: BookingFormProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const capacity = getRoomCapacity(roomType);
  const exceedsCapacity = guests > capacity;
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soldOut, setSoldOut] = useState(false);

  // Mirrors PricingService: base + 20% per extra guest over 2, then 12% tax.
  const nights = calculateNights(checkIn, checkOut);
  const roomPrice = getRoomPrice(roomType);
  const pricing = calculatePricing(roomPrice, nights, guests);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      toast.error('Please log in to make a booking');
      router.push(`/auth/login?redirect=/hotels/${hotel.slug}`);
      return;
    }

    // Mirror the server-side rules so obvious mistakes never cost a round trip.
    // The API validates `check_in` with `after:today` in ITS timezone, so this
    // is a fast path, not a guarantee -- the server is still authoritative.
    if (!isFutureDate(checkIn)) {
      setError('Check-in must be a date after today.');
      return;
    }

    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }

    if (exceedsCapacity) {
      setError(
        `This room sleeps ${capacity}. Reduce the party size or pick a larger room type.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /bookings → { room_type_id, check_in, check_out, guests_count,
      // special_requests }. The API resolves the hotel and a free room itself.
      const response = await bookingsApi.create({
        room_type_id: roomType.id,
        check_in: checkIn,
        check_out: checkOut,
        // parseGuests guarantees a finite 1-10 integer. Without it a NaN here
        // serialises to null and the API replies "The guests count field is
        // required.", which reads like a missing field rather than a bad one.
        guests_count: parseGuests(guests),
        special_requests: specialRequests || undefined,
      });

      const booking = response.data?.data ?? response.data;
      toast.success('Booking created successfully!');
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      /**
       * The most common 422 here is not a malformed field -- it is
       * BookingService failing to find a free room, which surfaces as
       * `errors.room_type_id: ["No rooms available for the selected dates."]`.
       *
       * The hotel detail response cannot predict this: RoomTypeResource only
       * exposes `available_rooms` when rooms are eager-loaded, and
       * HotelController@show does not load them. So we correct the UI here.
       */
      if (isNoRoomsAvailableError(err)) {
        setSoldOut(true);
        setError(
          'Those dates just sold out for this room type. Pick different dates or another room.',
        );
        onSoldOut?.();
      } else {
        setError(getApiErrorMessage(err, 'Could not create the booking.'));
      }
      console.error('Booking error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-secondary-100 p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">Booking Summary</h3>

      {/* Room Info */}
      <div className="bg-secondary-50 rounded-xl p-4 mb-4">
        <h4 className="font-medium text-secondary-900">{roomType.name}</h4>
        <p className="text-sm text-secondary-500">{hotel.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary-500 mb-1">Check In</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary-50 rounded-lg text-sm">
              <FiCalendar className="text-secondary-400" />
              <span>{checkIn}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-500 mb-1">Check Out</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary-50 rounded-lg text-sm">
              <FiCalendar className="text-secondary-400" />
              <span>{checkOut}</span>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="block text-xs font-medium text-secondary-500 mb-1">Guests</label>
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <select
              value={guests}
              onChange={(e) => onGuestsChange?.(parseGuests(e.target.value, guests))}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {/* Same options as the picker above; the ones this room cannot
                  take are shown but disabled, so the mismatch is visible
                  rather than the list silently being shorter. */}
              {guestOptions().map((n) => (
                <option key={n} value={n} disabled={n > capacity}>
                  {n} {n === 1 ? 'Guest' : 'Guests'}
                  {n > capacity ? ' — over room capacity' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {exceedsCapacity && (
          <p className="-mt-2 text-xs font-medium text-amber-600">
            {roomType.name} sleeps {capacity}. Choose {capacity} or fewer guests, or
            pick a larger room type.
          </p>
        )}

        {/* Special Requests */}
        <div>
          <label className="block text-xs font-medium text-secondary-500 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Any special requests for your stay..."
            className="w-full px-3 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-secondary-100 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">
              {formatCurrency(roomPrice)} × {pricing.nights}{' '}
              {pricing.nights === 1 ? 'night' : 'nights'}
            </span>
            <span className="text-secondary-700">{formatCurrency(pricing.base_price)}</span>
          </div>
          {pricing.extra_guest_charge > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-500">
                Extra {pricing.extra_guests === 1 ? 'guest' : 'guests'} ({pricing.extra_guests})
              </span>
              <span className="text-secondary-700">
                {formatCurrency(pricing.extra_guest_charge)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">Taxes &amp; fees ({pricing.tax_rate})</span>
            <span className="text-secondary-700">{formatCurrency(pricing.tax)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t border-secondary-100">
            <span className="text-secondary-900">Total</span>
            <span className="text-primary-700">{formatCurrency(pricing.total)}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2.5"
          >
            <FiAlertCircle className="mt-0.5 flex-shrink-0 text-danger-500" />
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          disabled={soldOut || exceedsCapacity}
          leftIcon={<FiCreditCard />}
        >
          {!isAuthenticated
            ? 'Login to Book'
            : soldOut
            ? 'Sold Out for These Dates'
            : 'Confirm Booking'}
        </Button>

        {onClose && (
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Cancel
          </Button>
        )}

        <p className="text-xs text-center text-secondary-400">
          You won&apos;t be charged yet. Payment is taken after the booking is created.
        </p>
      </form>
    </div>
  );
}
