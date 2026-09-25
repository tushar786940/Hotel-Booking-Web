'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import {
  FiHome,
  FiGrid,
  FiUsers,
  FiCalendar,
  FiStar,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiPlus,
  FiBarChart2,
} from 'react-icons/fi';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: <FiBarChart2 /> },
  { href: '/admin/hotels', label: 'Hotels', icon: <FiGrid /> },
  { href: '/admin/hotels/new', label: 'Add Hotel', icon: <FiPlus /> },
  { href: '/admin/bookings', label: 'Bookings', icon: <FiCalendar /> },
  { href: '/admin/reviews', label: 'Reviews', icon: <FiStar /> },
  { href: '/admin/users', label: 'Users', icon: <FiUsers /> },
  { href: '/admin/settings', label: 'Settings', icon: <FiSettings /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading admin..." />;
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/admin');
    return <LoadingSpinner fullScreen />;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-secondary-100 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-secondary-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <HiOutlineBuildingOffice2 className="text-white" />
            </div>
            <span className="font-bold text-secondary-900">StayHub</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-secondary-400 hover:text-secondary-600"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                )}
              >
                <span className={cn('text-lg', isActive ? 'text-primary-600' : 'text-secondary-400')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-secondary-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">{user?.name}</p>
              <p className="text-xs text-secondary-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-secondary-600 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <FiHome size={14} />
              Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors"
            >
              <FiLogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-secondary-100 px-4 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex-1" />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
          >
            <FiChevronLeft />
            Back to Site
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}