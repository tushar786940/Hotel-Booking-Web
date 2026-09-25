'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiCalendar, FiUsers, FiMapPin } from 'react-icons/fi';
import { generateBookingDates, guestOptions, parseGuests } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'compact' | 'inline';
  className?: string;
  defaultValues?: {
    city?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
  };
}

export default function SearchBar({
  variant = 'hero',
  className,
  defaultValues,
}: SearchBarProps) {
  const router = useRouter();
  const { defaultCheckIn, defaultCheckOut, minCheckIn } = generateBookingDates();

  const [city, setCity] = useState(defaultValues?.city || '');
  const [checkIn, setCheckIn] = useState(defaultValues?.check_in || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultValues?.check_out || defaultCheckOut);
  const [guests, setGuests] = useState(parseGuests(defaultValues?.guests));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    params.set('guests', String(parseGuests(guests)));

    router.push(`/search?${params.toString()}`);
  };

  if (variant === 'hero') {
    return (
      <form
        onSubmit={handleSearch}
        className={cn(
          'bg-white rounded-2xl shadow-card p-4 md:p-6',
          className
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Destination */}
          <div className="relative">
            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1.5">
              Destination
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Where are you going?"
                className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Check-in */}
          <div>
            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1.5">
              Check In
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (e.target.value >= checkOut) {
                    const nextDay = new Date(e.target.value);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCheckOut(nextDay.toISOString().split('T')[0]);
                  }
                }}
                min={minCheckIn}
                className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Check-out */}
          <div>
            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1.5">
              Check Out
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || minCheckIn}
                className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Guests + Search */}
          <div>
            <label className="block text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1.5">
              Guests
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseGuests(e.target.value, guests))}
                  className="w-full pl-10 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none transition-all"
                >
                  {guestOptions().map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <FiSearch />
                <span className="hidden lg:inline">Search</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  // Compact variant
  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        'flex flex-wrap items-end gap-3 bg-white p-4 rounded-xl shadow-card border border-secondary-100',
        className
      )}
    >
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-secondary-500 mb-1">Destination</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-secondary-500 mb-1">Check In</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          min={minCheckIn}
          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="min-w-[140px]">
        <label className="block text-xs font-medium text-secondary-500 mb-1">Check Out</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn || minCheckIn}
          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="min-w-[100px]">
        <label className="block text-xs font-medium text-secondary-500 mb-1">Guests</label>
        <select
          value={guests}
          onChange={(e) => setGuests(parseGuests(e.target.value, guests))}
          className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {guestOptions().map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
      >
        <FiSearch />
        Search
      </button>
    </form>
  );
}