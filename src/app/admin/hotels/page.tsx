'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Hotel } from '@/types';
import { manageApi } from '@/lib/api';
import { getHotelImage, formatCurrency, getHotelMinPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin, FiStar } from 'react-icons/fi';

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHotels = async () => {
    setIsLoading(true);
    try {
      const response = await manageApi.listHotels();
      const data = response.data?.data ?? response.data;
      setHotels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      await manageApi.deleteHotel(id);
      toast.success('Hotel deleted successfully');
      fetchHotels();
    } catch {
      // 422 (active bookings) is surfaced by the interceptor.
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHotels = hotels.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Hotels</h1>
          <p className="text-secondary-500 text-sm mt-1">{hotels.length} hotels total</p>
        </div>
        <Link href="/admin/hotels/new">
          <Button leftIcon={<FiPlus />}>Add Hotel</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search hotels by name or city..."
          className="input-field pl-10"
        />
      </div>

      {/* Hotels Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" message="Loading hotels..." />
      ) : filteredHotels.length > 0 ? (
        <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wide">Hotel</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wide">Stars</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wide">Price</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-secondary-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={getHotelImage(hotel)}
                            alt={hotel.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900 text-sm">{hotel.name}</p>
                          <p className="text-xs text-secondary-400">{hotel.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-secondary-600">
                        <FiMapPin className="text-secondary-400 text-xs" />
                        {hotel.city}, {hotel.country}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <FiStar className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{hotel.star_rating}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={hotel.is_active === false ? 'cancelled' : 'confirmed'} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-secondary-900">
                        {getHotelMinPrice(hotel) > 0 ? formatCurrency(getHotelMinPrice(hotel)) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/hotels/${hotel.id}/edit`}>
                          <Button variant="ghost" size="sm" leftIcon={<FiEdit2 />}>
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<FiTrash2 />}
                          onClick={() => handleDelete(hotel.id, hotel.name)}
                          isLoading={deletingId === hotel.id}
                          className="text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                        >
                          Delete
                        </Button>
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
          <p className="text-secondary-500 mb-4">No hotels found</p>
          <Link href="/admin/hotels/new">
            <Button leftIcon={<FiPlus />}>Add Your First Hotel</Button>
          </Link>
        </div>
      )}
    </div>
  );
}