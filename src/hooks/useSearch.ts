'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchFilters } from '@/types';
import { generateBookingDates } from '@/lib/utils';

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { defaultCheckIn, defaultCheckOut } = generateBookingDates();

  const [filters, setFilters] = useState<SearchFilters>({
    city: searchParams.get('city') || '',
    check_in: searchParams.get('check_in') || defaultCheckIn,
    check_out: searchParams.get('check_out') || defaultCheckOut,
    guests: parseInt(searchParams.get('guests') || '2'),
    min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
    stars: searchParams.get('stars') ? parseInt(searchParams.get('stars')!) : undefined,
    sort_by: (searchParams.get('sort_by') as SearchFilters['sort_by']) || undefined,
    page: parseInt(searchParams.get('page') || '1'),
  });

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  }, []);

  const search = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    router.push(`/search?${params.toString()}`);
  }, [filters, router]);

  const resetFilters = useCallback(() => {
    setFilters({
      city: '',
      check_in: defaultCheckIn,
      check_out: defaultCheckOut,
      guests: 2,
      page: 1,
    });
  }, [defaultCheckIn, defaultCheckOut]);

  return {
    filters,
    setFilters,
    updateFilter,
    search,
    resetFilters,
  };
}