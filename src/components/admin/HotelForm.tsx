'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HotelFormData } from '@/types';
import Button from '@/components/ui/Button';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const ALL_AMENITIES = [
  'wifi',
  'parking',
  'pool',
  'gym',
  'spa',
  'restaurant',
  'bar',
  'room_service',
  'laundry',
  'airport_shuttle',
  'pet_friendly',
  'business_center',
  'concierge',
  'air_conditioning',
  'heating',
];

export const EMPTY_HOTEL: HotelFormData = {
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zip_code: '',
  star_rating: 3,
  check_in_time: '14:00',
  check_out_time: '11:00',
  amenities: [],
};

interface HotelFormProps {
  /** Pre-filled values when editing. */
  initialValues?: HotelFormData;
  initialIsActive?: boolean;
  submitLabel: string;
  heading: string;
  /** `is_active` is only accepted by the update endpoint, so it is passed separately. */
  onSubmit: (values: HotelFormData, isActive: boolean) => Promise<void>;
}

/**
 * Shared create/edit form. Field names mirror AdminHotelController's
 * validation rules exactly (`star_rating`, `zip_code`, `check_in_time`, …).
 */
export default function HotelForm({
  initialValues = EMPTY_HOTEL,
  initialIsActive = true,
  submitLabel,
  heading,
  onSubmit,
}: HotelFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<HotelFormData>(initialValues);
  const [isActive, setIsActive] = useState(initialIsActive);

  const updateField = <K extends keyof HotelFormData>(field: K, value: HotelFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: (prev.amenities ?? []).includes(amenity)
        ? (prev.amenities ?? []).filter((a) => a !== amenity)
        : [...(prev.amenities ?? []), amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData, isActive);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/admin/hotels')}
        className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700 mb-4"
      >
        <FiArrowLeft /> Back to Hotels
      </button>

      <h1 className="text-2xl font-bold text-secondary-900 mb-6">{heading}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-secondary-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Hotel Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Grand Plaza Hotel"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                placeholder="Describe the hotel..."
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Star Rating</label>
                <select
                  value={formData.star_rating}
                  onChange={(e) => updateField('star_rating', parseInt(e.target.value))}
                  className="input-field"
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <option key={s} value={s}>
                      {s} Star{s > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-secondary-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Location</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main Street"
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  type="text"
                  value={formData.state ?? ''}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Country *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Zip Code</label>
                <input
                  type="text"
                  value={formData.zip_code ?? ''}
                  onChange={(e) => updateField('zip_code', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-secondary-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Check-in / Check-out</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check-in Time</label>
              <input
                type="time"
                value={formData.check_in_time ?? '14:00'}
                onChange={(e) => updateField('check_in_time', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Check-out Time</label>
              <input
                type="time"
                value={formData.check_out_time ?? '11:00'}
                onChange={(e) => updateField('check_out_time', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-secondary-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_AMENITIES.map((amenity) => {
              const selected = (formData.amenities ?? []).includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    selected
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'bg-secondary-50 text-secondary-600 border border-secondary-200 hover:bg-secondary-100'
                  }`}
                >
                  {amenity.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="lg" isLoading={isSubmitting} leftIcon={<FiSave />}>
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => router.push('/admin/hotels')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
