'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Hotel, PaginationMeta, SearchFilters, SortBy, SortOrder } from '@/types';
import { availabilityApi, canUseAvailabilitySearch } from '@/lib/api';
import { generateBookingDates, getHotelMinPrice, parseGuests } from '@/lib/utils';
import SearchBar from '@/components/layout/SearchBar';
import HotelCard from '@/components/hotels/HotelCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { FiFilter, FiX, FiChevronDown, FiInfo } from 'react-icons/fi';
import { cn } from '@/lib/utils';

/**
 * Sort values understood by `GET /hotels`:
 *   sort_by=price&sort_order=asc|desc   |   sort_by=rating
 * They are combined into a single select value here.
 */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Sort by: Default' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

function parseSort(value: string): { sort_by?: SortBy; sort_order?: SortOrder } {
  if (!value) return {};
  const [sortBy, sortOrder] = value.split(':');
  return {
    sort_by: sortBy as SortBy,
    sort_order: (sortOrder as SortOrder) || undefined,
  };
}

/** `GET /search` ignores sorting, so results are ordered client-side. */
function sortHotels(hotels: Hotel[], sort: string): Hotel[] {
  if (!sort) return hotels;
  const sorted = [...hotels];

  if (sort === 'rating') {
    return sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
  }

  const direction = sort === 'price:desc' ? -1 : 1;
  return sorted.sort(
    (a, b) => (getHotelMinPrice(a) - getHotelMinPrice(b)) * direction,
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const { defaultCheckIn, defaultCheckOut } = generateBookingDates();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [availabilityMode, setAvailabilityMode] = useState(false);

  // Filter states (names match the API query parameters)
  const [sort, setSort] = useState(() => {
    const sortBy = searchParams.get('sort_by');
    if (!sortBy) return '';
    if (sortBy === 'rating') return 'rating';
    return `price:${searchParams.get('sort_order') || 'asc'}`;
  });
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [starRating, setStarRating] = useState(
    searchParams.get('star_rating') || searchParams.get('stars') || '',
  );
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  const fetchHotels = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);

      const filters: SearchFilters = {
        city: searchParams.get('city')?.trim() || undefined,
        check_in: searchParams.get('check_in') || undefined,
        check_out: searchParams.get('check_out') || undefined,
        guests: searchParams.get('guests')
          ? parseGuests(searchParams.get('guests'))
          : undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        star_rating: starRating ? Number(starRating) : undefined,
        page,
        per_page: 12,
        ...parseSort(sort),
      };

      const usesAvailability = canUseAvailabilitySearch(filters);
      setAvailabilityMode(usesAvailability);

      try {
        // Falls back to GET /hotels when the date range is not bookable.
        const response = await availabilityApi.search(filters);
        const body = response.data;
        const list: Hotel[] = Array.isArray(body) ? body : body?.data ?? [];

        setHotels(usesAvailability ? sortHotels(list, sort) : list);
        setMeta(body?.meta ?? null);
        setCurrentPage(page);
      } catch (error) {
        console.error('Search error:', error);
        setHotels([]);
        setMeta(null);
      } finally {
        setIsLoading(false);
      }
    },
    [searchParams, sort, minPrice, maxPrice, starRating],
  );

  useEffect(() => {
    fetchHotels(1);
  }, [fetchHotels]);

  const handlePageChange = (page: number) => {
    fetchHotels(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSort('');
    setMinPrice('');
    setMaxPrice('');
    setStarRating('');
  };

  const hasActiveFilters = Boolean(sort || minPrice || maxPrice || starRating);
  const resultCount = meta?.total ?? hotels.length;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-secondary-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar
            variant="compact"
            defaultValues={{
              city: searchParams.get('city') || '',
              check_in: searchParams.get('check_in') || defaultCheckIn,
              check_out: searchParams.get('check_out') || defaultCheckOut,
              guests: parseGuests(searchParams.get('guests')),
            }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {searchParams.get('city')
                ? `Hotels in ${searchParams.get('city')}`
                : 'All Hotels'}
            </h1>
            <p className="text-sm text-secondary-500 mt-1">
              {resultCount} {resultCount === 1 ? 'hotel' : 'hotels'}{' '}
              {availabilityMode ? 'available for your dates' : 'found'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value || 'default'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                showFilters || hasActiveFilters
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-secondary-200 text-secondary-600 bg-white hover:bg-secondary-50'
              )}
            >
              <FiFilter />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-secondary-100 p-6 mb-6 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-secondary-900">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-danger-500 hover:text-danger-600"
                >
                  <FiX />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary-500 mb-1.5">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-secondary-400">-</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-500 mb-1.5">
                  Star Rating
                </label>
                <select
                  value={starRating}
                  onChange={(e) => setStarRating(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Any</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={() => fetchHotels(1)} fullWidth>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" message="Loading hotels..." />
          </div>
        ) : hotels.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  stay={{
                    check_in: searchParams.get('check_in'),
                    check_out: searchParams.get('check_out'),
                    guests: parseGuests(searchParams.get('guests')),
                  }}
                />
              ))}
            </div>

            {/* Pagination — the availability search returns every match at once */}
            {meta && (meta.last_page ?? 1) > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>

                {Array.from({ length: meta.last_page ?? 1 }, (_, i) => i + 1)
                  .filter((page) => {
                    const lastPage = meta.last_page ?? 1;
                    if (lastPage <= 7) return true;
                    if (page === 1 || page === lastPage) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-secondary-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          'w-10 h-10 rounded-xl text-sm font-medium transition-colors',
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-secondary-600 hover:bg-secondary-50 border border-secondary-200'
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= (meta.last_page ?? 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏨</span>
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No hotels found</h3>
            <p className="text-secondary-500 mb-6">
              Try adjusting your search criteria or explore different destinations.
            </p>
            {availabilityMode && (
              <p className="flex items-center justify-center gap-2 text-xs text-secondary-400 mb-6">
                <FiInfo />
                Only hotels with a free room for these exact dates are listed.
              </p>
            )}
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading search..." />}>
      <SearchContent />
    </Suspense>
  );
}
