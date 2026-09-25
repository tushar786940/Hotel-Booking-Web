'use client';

import React, { useEffect, useState } from 'react';
import { Booking } from '@/types';
import { bookingsApi, adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiCalendar, FiUser, FiChevronDown } from 'react-icons/fi';

const STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await bookingsApi.list({ per_page: 50 });
      const data = response.data?.data || response.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await adminApi.updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Bookings</h1>
        <p className="text-secondary-500 text-sm mt-1">{bookings.length} bookings total</p>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading bookings..." />
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Booking #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Guest</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Hotel</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Dates</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-secondary-50/50">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium text-secondary-900">
                        {booking.booking_number}
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
                        {booking.hotel?.name || '—'}
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
                      <div className="relative">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                          disabled={updatingId === booking.id}
                          className="appearance-none pl-2 pr-7 py-1.5 text-xs font-medium bg-secondary-50 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none text-xs" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-secondary-100">
          <p className="text-secondary-500">No bookings yet</p>
        </div>
      )}
    </div>
  );
}