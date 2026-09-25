'use client';

import React, { useEffect, useState } from 'react';
import { adminApi, bookingsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FiGrid, FiCalendar, FiDollarSign, FiTrendingUp, FiUsers, FiStar } from 'react-icons/fi';

interface Stats {
  totalHotels: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  totalUsers: number;
  avgRating: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    totalUsers: 0,
    avgRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [hotelsRes, bookingsRes] = await Promise.allSettled([
          adminApi.listHotels({ per_page: 1 }),
          bookingsApi.list({ per_page: 1 }),
        ]);

        const hotelMeta = hotelsRes.status === 'fulfilled'
          ? hotelsRes.value.data?.meta
          : null;
        const bookingMeta = bookingsRes.status === 'fulfilled'
          ? bookingsRes.value.data?.meta
          : null;

        setStats({
          totalHotels: hotelMeta?.total || 0,
          totalBookings: bookingMeta?.total || 0,
          totalRevenue: 0, // Will be populated from backend analytics
          pendingBookings: 0,
          totalUsers: 0,
          avgRating: 4.5,
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
      label: 'Total Hotels',
      value: stats.totalHotels.toString(),
      icon: <FiGrid className="text-2xl" />,
      color: 'bg-blue-50 text-blue-600',
      change: '+2 this month',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: <FiCalendar className="text-2xl" />,
      color: 'bg-green-50 text-green-600',
      change: '+12% vs last month',
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: <FiDollarSign className="text-2xl" />,
      color: 'bg-emerald-50 text-emerald-600',
      change: '+8% vs last month',
    },
    {
      label: 'Pending Bookings',
      value: stats.pendingBookings.toString(),
      icon: <FiTrendingUp className="text-2xl" />,
      color: 'bg-amber-50 text-amber-600',
      change: 'Needs attention',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: <FiUsers className="text-2xl" />,
      color: 'bg-purple-50 text-purple-600',
      change: '+5 this week',
    },
    {
      label: 'Avg Rating',
      value: stats.avgRating.toFixed(1),
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
            { href: '/admin/bookings', label: 'View Bookings', desc: 'Manage reservations' },
            { href: '/admin/reviews', label: 'Moderate Reviews', desc: 'Approve or remove reviews' },
            { href: '/admin/users', label: 'Manage Users', desc: 'View and edit users' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="p-4 rounded-xl border border-secondary-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
            >
              <p className="font-medium text-secondary-900 group-hover:text-primary-700">
                {action.label}
              </p>
              <p className="text-xs text-secondary-400 mt-1">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}