'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { manageApi } from '@/lib/api';
import { Hotel, HotelFormData } from '@/types';
import HotelForm, { EMPTY_HOTEL } from '@/components/admin/HotelForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchHotel = useCallback(async () => {
    try {
      // GET /manage/hotels/{hotel} → { data: Hotel }
      const response = await manageApi.getHotel(hotelId);
      setHotel(response.data?.data ?? response.data);
    } catch (error) {
      console.error('Failed to fetch hotel:', error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  const handleUpdate = async (values: HotelFormData, isActive: boolean) => {
    try {
      // PUT /manage/hotels/{hotel} — the update validator does accept is_active.
      await manageApi.updateHotel(hotelId, { ...values, is_active: isActive });
      toast.success('Hotel updated successfully!');
      router.push('/admin/hotels');
    } catch (error) {
      console.error('Update hotel error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound || !hotel) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold text-secondary-900 mb-2">Hotel not found</h1>
        <p className="text-secondary-500 mb-6">
          It may have been deleted, or it belongs to another owner.
        </p>
        <Link href="/admin/hotels">
          <Button>Back to Hotels</Button>
        </Link>
      </div>
    );
  }

  const initialValues: HotelFormData = {
    ...EMPTY_HOTEL,
    name: hotel.name ?? '',
    description: hotel.description ?? '',
    address: hotel.address ?? '',
    city: hotel.city ?? '',
    state: hotel.state ?? '',
    country: hotel.country ?? '',
    zip_code: hotel.zip_code ?? '',
    star_rating: hotel.star_rating ?? 3,
    // The API returns "14:00:00"; <input type="time"> wants "14:00".
    check_in_time: (hotel.check_in_time ?? '14:00').slice(0, 5),
    check_out_time: (hotel.check_out_time ?? '11:00').slice(0, 5),
    amenities: hotel.amenities ?? [],
  };

  return (
    <HotelForm
      heading={`Edit ${hotel.name}`}
      submitLabel="Save Changes"
      initialValues={initialValues}
      initialIsActive={hotel.is_active !== false}
      onSubmit={handleUpdate}
    />
  );
}
