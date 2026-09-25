'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoomType, Hotel } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi } from '@/lib/api';
import { formatCurrency, calculateNights, getRoomPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { FiCalendar, FiUsers, FiCreditCard } from 'react-icons/fi';

interface BookingFormProps {
  hotel: Hotel;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  onClose?: () => void;
}

export default function BookingForm({ hotel, roomType, checkIn, checkOut, onClose }: BookingFormProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Price & Nights calculation
  const nights = calculateNights(checkIn, checkOut);
  const validNights = Math.max(nights, 1);
  const roomPrice = getRoomPrice(roomType);
  const subtotal = roomPrice * validNights;
  const taxes = subtotal * 0.12; // 12% tax
  const total = subtotal + taxes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to make a booking');
      router.push(`/auth/login?redirect=/hotels/${hotel.slug}`);
      return;
    }

    if (nights <= 0) {
      toast.error('Please select valid check-in and check-out dates');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await bookingsApi.create({
        hotel_id: hotel.id,
        room_type_id: roomType.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        special_requests: specialRequests || undefined,
      });

      const booking = response.data?.data || response.data;
      toast.success('Booking created successfully!');
      router.push(`/bookings/${booking.id}`);
    } catch (error: any) {
      console.error('Booking error:', error);
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
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: roomType.max_guests || 2 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-xs font-medium text-secondary-500 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            placeholder="Any special requests for your stay..."
            className="w-full px-3 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-secondary-100 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">
              {formatCurrency(roomPrice)} × {validNights} {validNights === 1 ? 'night' : 'nights'}
            </span>
            <span className="text-secondary-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-500">Taxes & fees (12%)</span>
            <span className="text-secondary-700">{formatCurrency(taxes)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-lg pt-2 border-t border-secondary-100">
            <span className="text-secondary-900">Total</span>
            <span className="text-primary-700">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<FiCreditCard />}
        >
          {isAuthenticated ? 'Confirm Booking' : 'Login to Book'}
        </Button>

        {onClose && (
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
        )}

        <p className="text-xs text-center text-secondary-400">
          You won&apos;t be charged yet. Payment is processed after confirmation.
        </p>
      </form>
    </div>
  );
}