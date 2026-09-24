'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Hotel, PaginatedResponse } from '@/types';
import { hotelsApi } from '@/lib/api';
import SearchBar from '@/components/layout/SearchBar';
import HotelCard from '@/components/hotels/HotelCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { cn } from '@/lib/utils';

function SearchContent() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<PaginatedResponse<Hotel>['meta'] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [stars, setStars] = useState(searchParams.get('stars') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  const fetchHotels = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        per_page: 12,
      };

      const city = searchParams.get('city');
      const checkIn = searchParams.get('check_in');
      const checkOut = searchParams.get('check_out');
      const guests = searchParams.get('guests');

      if (city) params.city = city;
      if (checkIn) params.check_in = checkIn;
      if (checkOut) params.check_out = checkOut;
      if (guests) params.guests = guests;
      if (sortBy) params.sort_by = sortBy;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (stars) params.stars = stars;

      const response = await hotelsApi.search(params);
      const data = response.data;

      setHotels(data.data || []);
      setMeta(data.meta || null);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search failed:', error);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, sortBy, minPrice, maxPrice, stars]);

  useEffect(() => {
    fetchHotels(1);
  }, [fetchHotels]);

  const handlePageChange = (page: number) => {
    fetchHotels(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSortBy('');
    setMinPrice('');
    setMaxPrice('');
    setStars('');
  };

  const hasActiveFilters = sortBy || minPrice || maxPrice || stars;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-secondary-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar
            variant="compact"
            defaultValues={{
              city: searchParams.get('city') || '',
              check_in: searchParams.get('check_in') || undefined,
              check_out: searchParams.get('check_out') || undefined,
              guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : 2,
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
            {meta && (
              <p className="text-sm text-secondary-500 mt-1">
                {meta.total} {meta.total === 1 ? 'hotel' : 'hotels'} found
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              >
                <option value="">Sort by: Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name: A-Z</option>
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
              {/* Price Range */}
              <div>
                <label className="block text-xs font-medium text-secondary-500 mb-1.5">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-secondary-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-medium text-secondary-500 mb-1.5">
                  Star Rating
                </label>
                <select
                  value={stars}
                  onChange={(e) => setStars(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary-50 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Any</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              {/* Apply */}
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
            <LoadingSpinner size="lg" message="Searching hotels..." />
          </div>
        ) : hotels.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>

                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                  .filter(page => {
                    if (meta.last_page <= 7) return true;
                    if (page === 1 || page === meta.last_page) return true;
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
                  disabled={currentPage >= (meta?.last_page || 1)}
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