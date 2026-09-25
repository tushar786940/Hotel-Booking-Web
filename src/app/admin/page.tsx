'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Booking, Hotel } from '@/types';
import { manageApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FiGrid, FiCalendar, FiDollarSign, FiTrendingUp, FiStar, FiHome } from 'react-icons/fi';

interface Stats {
  totalHotels: number;
  totalRooms: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  avgRating: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalHotels: 0,
    totalRooms: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    avgRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // GET /manage/hotels returns every hotel the owner has (no pagination).
        const hotelsRes = await manageApi.listHotels();
        const hotels: Hotel[] = hotelsRes.data?.data ?? [];

        // Bookings live per hotel: GET /manage/hotels/{hotel}/bookings
        const bookingResponses = await Promise.allSettled(
          hotels.map((hotel) => manageApi.listBookings(hotel.id)),
        );

        const bookings: Booking[] = bookingResponses.flatMap((result) =>
          result.status === 'fulfilled' ? result.value.data?.data ?? [] : [],
        );

        const bookingTotals = bookingResponses.reduce((sum, result) => {
          if (result.status !== 'fulfilled') return sum;
          return sum + (result.value.data?.meta?.total ?? 0);
        }, 0);

        const ratings = hotels
          .map((hotel) => hotel.average_rating || 0)
          .filter((rating) => rating > 0);

        setStats({
          totalHotels: hotels.length,
          totalRooms: hotels.reduce(
            (sum, hotel) =>
              sum +
              (hotel.room_types ?? []).reduce(
                (rooms, roomType) => rooms + (roomType.total_rooms || 0),
                0,
              ),
            0,
          ),
          totalBookings: bookingTotals || bookings.length,
          totalRevenue: bookings
            .filter((booking) => booking.payment?.status === 'completed')
            .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
          pendingBookings: bookings.filter((booking) => booking.status === 'pending').length,
          avgRating: ratings.length
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading dashboard..." />;
  }

  const statCards = [
    {
      label: 'My Hotels',
      value: stats.totalHotels.toString(),
      icon: <FiGrid className="text-2xl" />,
      color: 'bg-blue-50 text-blue-600',
      change: 'Managed by you',
    },
    {
      label: 'Rooms',
      value: stats.totalRooms.toString(),
      icon: <FiHome className="text-2xl" />,
      color: 'bg-indigo-50 text-indigo-600',
      change: 'Across all room types',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: <FiCalendar className="text-2xl" />,
      color: 'bg-green-50 text-green-600',
      change: 'All time',
    },
    {
      label: 'Paid Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <FiDollarSign className="text-2xl" />,
      color: 'bg-emerald-50 text-emerald-600',
      change: 'Completed payments',
    },
    {
      label: 'Pending Bookings',
      value: stats.pendingBookings.toString(),
      icon: <FiTrendingUp className="text-2xl" />,
      color: 'bg-amber-50 text-amber-600',
      change: 'Awaiting payment',
    },
    {
      label: 'Avg Rating',
      value: stats.avgRating ? stats.avgRating.toFixed(1) : '—',
      icon: <FiStar className="text-2xl" />,
      color: 'bg-yellow-50 text-yellow-600',
      change: 'Out of 5.0',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-500 mt-1">Welcome back! Here&apos;s your hotel overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-secondary-100 p-5 hover:shadow-card transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-secondary-500">{stat.label}</p>
                <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-secondary-400 mt-3">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-secondary-100 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/hotels/new', label: 'Add New Hotel', desc: 'Create a hotel listing' },
            { href: '/admin/hotels', label: 'Manage Hotels', desc: 'Edit or remove listings' },
            { href: '/admin/bookings', label: 'View Bookings', desc: 'Check guests in and out' },
            { href: '/admin/reviews', label: 'Read Reviews', desc: 'See what guests said' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="p-4 rounded-xl border border-secondary-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
            >
              <p className="font-medium text-secondary-900 group-hover:text-primary-700">
                {action.label}
              </p>
              <p className="text-xs text-secondary-400 mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
