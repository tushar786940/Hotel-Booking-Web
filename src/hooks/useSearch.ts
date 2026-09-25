'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchFilters, SortBy, SortOrder } from '@/types';
import { generateBookingDates } from '@/lib/utils';

/**
 * Keeps the search form in sync with the query string.
 * Parameter names mirror the API (`star_rating`, `sort_by`, `sort_order`).
 */
export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { defaultCheckIn, defaultCheckOut } = generateBookingDates();

  const [filters, setFilters] = useState<SearchFilters>({
    city: searchParams.get('city') || '',
    check_in: searchParams.get('check_in') || defaultCheckIn,
    check_out: searchParams.get('check_out') || defaultCheckOut,
    guests: parseInt(searchParams.get('guests') || '2'),
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    star_rating: searchParams.get('star_rating')
      ? Number(searchParams.get('star_rating'))
      : undefined,
    sort_by: (searchParams.get('sort_by') as SortBy) || undefined,
    sort_order: (searchParams.get('sort_order') as SortOrder) || undefined,
    page: parseInt(searchParams.get('page') || '1'),
  });

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: key !== 'page' ? 1 : (value as number),
      }));
    },
    [],
  );

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
