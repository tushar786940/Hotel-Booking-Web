'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { manageApi } from '@/lib/api';
import HotelForm from '@/components/admin/HotelForm';
import { HotelFormData } from '@/types';
import toast from 'react-hot-toast';

export default function CreateHotelPage() {
  const router = useRouter();

  const handleCreate = async (values: HotelFormData, isActive: boolean) => {
    try {
      const response = await manageApi.createHotel(values);

      // `is_active` is not part of the store validator — only the update one.
      const created = response.data?.data;
      if (!isActive && created?.id) {
        await manageApi.updateHotel(created.id, { is_active: false });
      }

      toast.success('Hotel created successfully!');
      router.push('/admin/hotels');
    } catch (error) {
      // Validation messages are surfaced by the axios interceptor.
      console.error('Create hotel error:', error);
    }
  };

  return (
    <HotelForm heading="Create New Hotel" submitLabel="Create Hotel" onSubmit={handleCreate} />
  );
}
