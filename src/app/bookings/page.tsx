'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi } from '@/lib/api';
import BookingCard from '@/components/bookings/BookingCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { FiCalendar } from 'react-icons/fi';

type TabType = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function BookingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      // GET /bookings → { data: Booking[], meta: { current_page, ... } }
      const response = await bookingsApi.list();
      const data = response.data?.data ?? response.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/bookings');
      return;
    }

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, authLoading, router, fetchBookings]);

  const filteredBookings = bookings.filter((booking) => {
    switch (activeTab) {
      case 'upcoming':
        return ['pending', 'confirmed'].includes(booking.status);
      case 'completed':
        return ['checked_out', 'checked_in'].includes(booking.status);
      case 'cancelled':
        return ['cancelled', 'refunded'].includes(booking.status);
      default:
        return true;
    }
  });

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: bookings.length },
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length,
    },
    {
      key: 'completed',
      label: 'Completed',
      count: bookings.filter((b) => ['checked_out', 'checked_in'].includes(b.status)).length,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: bookings.filter((b) => ['cancelled', 'refunded'].includes(b.status)).length,
    },
  ];

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        <h1 className="section-title mb-6">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-secondary-900 shadow-sm'
                  : 'text-secondary-500 hover:text-secondary-700'
              )}
            >
              {tab.label}
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-secondary-200 text-secondary-500'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading bookings..." />
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCalendar className="text-3xl text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No bookings found</h3>
            <p className="text-secondary-500 mb-6">
              {activeTab === 'all'
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings found.`}
            </p>
            <Button onClick={() => router.push('/search')}>
              Browse Hotels
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}