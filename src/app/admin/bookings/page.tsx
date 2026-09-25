'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Booking, Hotel, ManageableBookingStatus } from '@/types';
import { manageApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiCalendar, FiUser, FiChevronDown } from 'react-icons/fi';

/**
 * Status transitions allowed by AdminBookingController@updateStatus.
 * Offering anything else just produces a 422.
 */
const ALLOWED_TRANSITIONS: Record<string, ManageableBookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  refunded: [],
};

export default function AdminBookingsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Bookings are scoped per hotel: GET /manage/hotels/{hotel}/bookings
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await manageApi.listHotels();
        const data: Hotel[] = response.data?.data ?? [];
        setHotels(data);
        setSelectedHotelId(data[0]?.id ?? null);
      } catch (error) {
        console.error('Failed to fetch hotels:', error);
      } finally {
        if (!hotels.length) setIsLoading(false);
      }
    };

    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!selectedHotelId) return;
    setIsLoading(true);
    try {
      const response = await manageApi.listBookings(selectedHotelId);
      const data = response.data?.data ?? [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedHotelId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (
    bookingId: number,
    newStatus: ManageableBookingStatus,
  ) => {
    setUpdatingId(bookingId);
    try {
      await manageApi.updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking status updated to ${newStatus.replace('_', ' ')}`);
      fetchBookings();
    } catch {
      // 422 with the allowed transitions is shown by the interceptor.
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Bookings</h1>
          <p className="text-secondary-500 text-sm mt-1">{bookings.length} bookings shown</p>
        </div>

        {hotels.length > 0 && (
          <div className="relative">
            <select
              value={selectedHotelId ?? ''}
              onChange={(e) => setSelectedHotelId(Number(e.target.value))}
              className="appearance-none pl-3 pr-9 py-2 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading bookings..." />
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Guest</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Room</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Dates</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {bookings.map((booking) => {
                  const transitions = ALLOWED_TRANSITIONS[booking.status] ?? [];

                  return (
                    <tr key={booking.id} className="hover:bg-secondary-50/50">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-medium text-secondary-900">
                          {booking.booking_reference}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-secondary-400" />
                          <span className="text-sm text-secondary-700">
                            {booking.user?.name || 'Guest'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-secondary-700">
                          {booking.room?.room_type} · {booking.room?.room_number}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <FiCalendar className="text-secondary-400 text-xs" />
                          {formatDate(booking.check_in, 'MMM dd')} – {formatDate(booking.check_out, 'MMM dd')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-secondary-900">
                          {formatCurrency(booking.total_price)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={booking.status} />
                      </td>
                      <td className="px-5 py-4">
                        {transitions.length > 0 ? (
                          <div className="relative">
                            <select
                              value=""
                              onChange={(e) =>
                                handleStatusChange(
                                  booking.id,
                                  e.target.value as ManageableBookingStatus,
                                )
                              }
                              disabled={updatingId === booking.id}
                              className="appearance-none pl-2 pr-7 py-1.5 text-xs font-medium bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            >
                              <option value="" disabled>
                                Change to…
                              </option>
                              {transitions.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none text-xs" />
                          </div>
                        ) : (
                          <span className="text-xs text-secondary-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-secondary-100">
          <p className="text-secondary-500">
            {hotels.length === 0
              ? 'Add a hotel first to start receiving bookings.'
              : 'No bookings for this hotel yet'}
          </p>
        </div>
      )}
    </div>
  );
}
