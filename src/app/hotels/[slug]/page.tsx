// src/app/hotels/[slug]/page.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Hotel, HotelReview, RoomAvailability, RoomType } from '@/types';
import { hotelsApi, availabilityApi, reviewsApi, isFutureDate } from '@/lib/api';
import {
  formatCurrency,
  formatMaybeDate,
  calculateNights,
  generateBookingDates,
  addDays,
  AMENITY_ICONS,
  getHotelMinPrice,
} from '@/lib/utils';
import HotelGallery from '@/components/hotels/HotelGallery';
import RoomCard from '@/components/hotels/RoomCard';
import BookingForm from '@/components/bookings/BookingForm';
import StarRating from '@/components/ui/StarRating';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { FiMapPin, FiClock, FiInfo } from 'react-icons/fi';

export default function HotelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const { defaultCheckIn, defaultCheckOut, minCheckIn } = generateBookingDates();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Booking state
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || defaultCheckOut);
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'));
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const nights = calculateNights(checkIn, checkOut);

  // ── Hotel details: GET /hotels/{hotel:slug} ──
  useEffect(() => {
    if (!slug) return;

    const fetchHotel = async () => {
      setIsLoading(true);
      try {
        const response = await hotelsApi.getBySlug(slug);
        const hotelData: Hotel = response.data?.data ?? response.data;
        setHotel(hotelData);
        setRoomTypes(hotelData?.room_types ?? []);

        // HotelDetailResource already embeds the 10 latest reviews.
        if (Array.isArray(hotelData?.reviews)) {
          setReviews(hotelData.reviews);
        } else if (hotelData?.id) {
          try {
            const reviewsResponse = await reviewsApi.listByHotel(hotelData.id);
            const reviewData = reviewsResponse.data?.data;
            setReviews(Array.isArray(reviewData) ? reviewData : []);
          } catch {
            setReviews([]);
          }
        }
      } catch {
        setError('Hotel not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [slug]);

  // ── Availability: GET /hotels/{hotel}/availability ──
  const checkAvailability = useCallback(async () => {
    if (!hotel?.id) return;

    // The endpoint requires check_in after today and check_out after check_in.
    if (!isFutureDate(checkIn) || checkOut <= checkIn) {
      setAvailabilityChecked(false);
      return;
    }

    try {
      const response = await availabilityApi.checkHotel(hotel.id, {
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });

      const available: RoomAvailability[] = response.data?.data ?? [];
      const byId = new Map(available.map((item) => [item.room_type.id, item]));

      setRoomTypes((previous) =>
        (previous.length > 0 ? previous : hotel.room_types ?? []).map((roomType) => ({
          ...roomType,
          available_rooms: byId.get(roomType.id)?.available_rooms ?? 0,
        })),
      );
      setAvailabilityChecked(true);
    } catch {
      // Keep whatever HotelDetailResource gave us on failure.
      setAvailabilityChecked(false);
    }
  }, [hotel, checkIn, checkOut, guests]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const handleBookRoom = (roomType: RoomType) => {
    setSelectedRoom(roomType);
    setShowBookingForm(true);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading hotel details..." />;
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Hotel Not Found</h2>
          <p className="text-secondary-500 mb-6">The hotel you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const hotelMinPrice = getHotelMinPrice({ ...hotel, room_types: roomTypes });
  const reviewsCount = hotel.reviews_count ?? reviews.length;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <HotelGallery images={hotel.images || []} hotelName={hotel.name || 'Hotel'} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hotel Info */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                      {hotel.star_rating || 3}-Star Hotel
                    </span>
                    {hotel.average_rating > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <StarRating rating={hotel.average_rating} size="sm" />
                        <span className="text-secondary-500">({reviewsCount})</span>
                      </div>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-secondary-900">{hotel.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-secondary-500">
                    <FiMapPin className="flex-shrink-0" />
                    <span>
                      {[hotel.address, hotel.city, hotel.state, hotel.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <FiClock className="text-primary-500" />
                  Check-in: {hotel.check_in_time || '14:00'}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <FiClock className="text-primary-500" />
                  Check-out: {hotel.check_out_time || '11:00'}
                </div>
              </div>
            </div>

            {/* Description */}
            {hotel.description && (
              <div className="bg-white rounded-2xl border border-secondary-100 p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-3">About This Hotel</h2>
                <p className="text-secondary-600 leading-relaxed whitespace-pre-line">{hotel.description}</p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities && Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-secondary-100 p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {hotel.amenities.map((amenity, index) => (
                    <div
                      key={`amenity-${amenity}-${index}`}
                      className="flex items-center gap-3 px-4 py-3 bg-secondary-50 rounded-xl"
                    >
                      <span className="text-lg">{AMENITY_ICONS[amenity] || '✓'}</span>
                      <span className="text-sm text-secondary-700 capitalize">
                        {String(amenity).replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date/Guest Picker */}
            <div className="bg-white rounded-2xl border border-secondary-100 p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Check Availability</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Check In</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={minCheckIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (e.target.value >= checkOut) {
                        setCheckOut(addDays(e.target.value, 1));
                      }
                    }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Check Out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={addDays(checkIn, 1)}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <p className="text-sm text-primary-600 font-medium">
                  {nights} {nights === 1 ? 'night' : 'nights'} stay
                </p>
                {!isFutureDate(checkIn) && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <FiInfo />
                    Check-in must be after today to check live availability.
                  </p>
                )}
              </div>
            </div>

            {/* Room Types */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                {availabilityChecked ? 'Available Rooms' : 'Room Types'}
              </h2>
              {roomTypes && roomTypes.length > 0 ? (
                <div className="space-y-4">
                  {roomTypes.map((roomType, index) => (
                    <RoomCard
                      key={roomType.id ? `room-type-${roomType.id}` : `room-type-${index}`}
                      roomType={roomType}
                      guests={guests}
                      nights={nights}
                      onBook={handleBookRoom}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-secondary-100 p-8 text-center">
                  <p className="text-secondary-500">No rooms available for the selected dates.</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-secondary-100 p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                Guest Reviews
                {reviews.length > 0 && (
                  <span className="text-sm font-normal text-secondary-500 ml-2">
                    ({reviewsCount})
                  </span>
                )}
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div
                      key={review.id ? `review-${review.id}` : `review-${index}`}
                      className="border-b border-secondary-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                            {review.user?.charAt(0)?.toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900 text-sm">
                              {review.user || 'Guest'}
                            </p>
                            <p className="text-xs text-secondary-400">
                              {formatMaybeDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-secondary-600 mt-3">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-500 text-center py-4">
                  No reviews yet. Be the first to leave a review!
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {showBookingForm && selectedRoom ? (
                <BookingForm
                  hotel={hotel}
                  roomType={selectedRoom}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                  onClose={() => setShowBookingForm(false)}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-secondary-100 p-6">
                  <div className="text-center">
                    {hotelMinPrice > 0 && (
                      <div className="mb-4">
                        <span className="text-sm text-secondary-500">Starting from</span>
                        <p className="text-3xl font-bold text-primary-700">
                          {formatCurrency(hotelMinPrice)}
                        </p>
                        <span className="text-sm text-secondary-500">per night</span>
                      </div>
                    )}

                    <p className="text-sm text-secondary-500 mb-4">
                      Select a room above to start your booking
                    </p>
                    <div className="text-xs text-secondary-400 space-y-1">
                      <p>✓ Free cancellation up to 24h before check-in</p>
                      <p>✓ Pay after your booking is created</p>
                      <p>✓ Best price guaranteed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
