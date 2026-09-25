'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Booking, ReviewFormData } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi, invoicesApi, reviewsApi } from '@/lib/api';
import { formatCurrency, formatDate, getImageUrl, getBookingPriceBreakdown, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import PaymentForm from '@/components/bookings/PaymentForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  FiMapPin, FiCalendar, FiUsers, FiClock, FiDownload, FiX, FiAlertCircle,
} from 'react-icons/fi';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const bookingId = parseInt(params.id as string);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
    pros: '',
    cons: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && bookingId) {
      fetchBooking();
    }
  }, [isAuthenticated, authLoading, bookingId, router]);

  const fetchBooking = async () => {
    setIsLoading(true);
    try {
      const response = await bookingsApi.getById(bookingId);
      setBooking(response.data.data || response.data);
    } catch (error) {
      toast.error('Booking not found');
      router.push('/bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await bookingsApi.cancel(bookingId, cancelReason);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      fetchBooking();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchBooking();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewData.title || !reviewData.comment) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewsApi.create(bookingId, reviewData);
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      fetchBooking();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const response = await invoicesApi.download(bookingId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${booking?.booking_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner fullScreen message="Loading booking details..." />;
  }

  if (!booking) {
    return null;
  }

  const hotel = booking.hotel;
  const roomType = booking.room_type;
  const payment = booking.payment;
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const needsPayment = booking.status === 'pending' && (!payment || payment.status !== 'completed');
  const canReview = booking.status === 'checked_out' && !booking.review;
  const imageUrl = hotel?.images?.[0] ? getImageUrl(hotel.images[0]) : '/images/placeholder-hotel.jpg';
  const price = getBookingPriceBreakdown(booking);

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/bookings')}
              className="text-sm text-secondary-500 hover:text-secondary-700 mb-2 flex items-center gap-1"
            >
              ← Back to Bookings
            </button>
            <h1 className="text-2xl font-bold text-secondary-900">Booking Details</h1>
          </div>
          <Badge status={booking.status} size="lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Info */}
            <div className="bg-white rounded-2xl border border-secondary-100 overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={imageUrl}
                  alt={hotel?.name || 'Hotel'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-secondary-900">{hotel?.name}</h2>
                {roomType && (
                  <p className="text-primary-600 font-medium mt-1">{roomType.name}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-secondary-500">
                  <FiMapPin />
                  <span>{hotel?.address}, {hotel?.city}, {hotel?.country}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-2xl border border-secondary-100 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Stay Details</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Check In</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiCalendar className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{formatDate(booking.check_in)}</p>
                  </div>
                  <p className="text-xs text-secondary-400 mt-0.5">{hotel?.check_in_time}</p>
                </div>

                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Check Out</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiCalendar className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{formatDate(booking.check_out)}</p>
                  </div>
                  <p className="text-xs text-secondary-400 mt-0.5">{hotel?.check_out_time}</p>
                </div>

                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Guests</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiUsers className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{booking.guests}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Nights</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiClock className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{price.nights}</p>
                  </div>
                </div>
              </div>

              {booking.special_requests && (
                <div className="mt-4 pt-4 border-t border-secondary-100">
                  <p className="text-xs text-secondary-400 uppercase tracking-wide mb-1">Special Requests</p>
                  <p className="text-sm text-secondary-600">{booking.special_requests}</p>
                </div>
              )}
            </div>

            {/* Payment Section */}
            {needsPayment && (
              <PaymentForm booking={booking} onPaymentSuccess={handlePaymentSuccess} />
            )}

            {/* Review Form */}
            {canReview && (
              <div className="bg-white rounded-2xl border border-secondary-100 p-6">
                {showReviewForm ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <h3 className="text-lg font-semibold text-secondary-900">Write a Review</h3>

                    <div>
                      <label className="label">Rating</label>
                      <StarRating
                        rating={reviewData.rating}
                        interactive
                        size="lg"
                        onChange={(rating) => setReviewData((prev) => ({ ...prev, rating }))}
                      />
                    </div>

                    <div>
                      <label className="label">Title *</label>
                      <input
                        type="text"
                        value={reviewData.title}
                        onChange={(e) => setReviewData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Summarize your experience"
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Review *</label>
                      <textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData((prev) => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        placeholder="Tell us about your stay..."
                        className="input-field resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Pros</label>
                        <input
                          type="text"
                          value={reviewData.pros}
                          onChange={(e) => setReviewData((prev) => ({ ...prev, pros: e.target.value }))}
                          placeholder="What did you like?"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Cons</label>
                        <input
                          type="text"
                          value={reviewData.cons}
                          onChange={(e) => setReviewData((prev) => ({ ...prev, cons: e.target.value }))}
                          placeholder="What could be better?"
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" isLoading={isSubmittingReview}>
                        Submit Review
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-secondary-500 mb-3">How was your stay?</p>
                    <Button onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Existing Review */}
            {booking.review && (
              <div className="bg-white rounded-2xl border border-secondary-100 p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-3">Your Review</h3>
                <StarRating rating={booking.review.rating} size="md" />
                <h4 className="font-medium text-secondary-900 mt-2">{booking.review.title}</h4>
                <p className="text-sm text-secondary-600 mt-1">{booking.review.comment}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Booking Number */}
            <div className="bg-white rounded-2xl border border-secondary-100 p-6">
              <p className="text-xs text-secondary-400 uppercase tracking-wide mb-1">Booking Number</p>
              <p className="text-lg font-mono font-bold text-secondary-900">{booking.booking_number}</p>
              <p className="text-xs text-secondary-400 mt-2">
                Booked on {formatDate(booking.created_at)}
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-2xl border border-secondary-100 p-6">
              <h3 className="font-semibold text-secondary-900 mb-3">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">
                    {formatCurrency(price.nightlyRate)} × {price.nights}{' '}
                    {price.nights === 1 ? 'night' : 'nights'}
                  </span>
                  <span>{formatCurrency(price.subtotal)}</span>
                </div>
                {price.taxes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Taxes & fees</span>
                    <span>{formatCurrency(price.taxes)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-secondary-100">
                  <span>Total</span>
                  <span className="text-primary-700">{formatCurrency(price.total)}</span>
                </div>
              </div>

              {/* Payment Status */}
              {payment && (
                <div className="mt-4 pt-4 border-t border-secondary-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-500">Payment</span>
                    <Badge status={payment.status} size="sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Download Invoice */}
              {payment?.status === 'completed' && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleDownloadInvoice}
                  isLoading={isDownloading}
                  leftIcon={<FiDownload />}
                >
                  Download Invoice
                </Button>
              )}

              {/* Cancel Booking */}
              {canCancel && (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setShowCancelModal(true)}
                  leftIcon={<FiX />}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-50 rounded-full flex items-center justify-center">
                <FiAlertCircle className="text-danger-500 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">Cancel Booking</h3>
            </div>
            <p className="text-sm text-secondary-500 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="label">Reason (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Why are you cancelling?"
                className="input-field resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleCancel}
                isLoading={isCancelling}
                fullWidth
              >
                Yes, Cancel Booking
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                fullWidth
              >
                Keep Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}