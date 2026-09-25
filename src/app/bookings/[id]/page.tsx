'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Booking, CreateReviewData, PriceBreakdown } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { bookingsApi, invoicesApi, reviewsApi } from '@/lib/api';
import {
  cancellationBlockedReason, formatCurrency, formatDate, getBookingPriceBreakdown,
} from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import PaymentForm from '@/components/bookings/PaymentForm';
import CancelBookingDialog from '@/components/bookings/CancelBookingDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FiMapPin, FiCalendar, FiUsers, FiClock, FiDownload, FiX, FiHome,
} from 'react-icons/fi';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const bookingId = parseInt(params.id as string);

  const [booking, setBooking] = useState<Booking | null>(null);
  // GET /bookings/{id} also returns the authoritative price breakdown.
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState<CreateReviewData>({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchBooking = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await bookingsApi.getById(bookingId);
      setBooking(response.data?.data ?? response.data);
      setPriceBreakdown(response.data?.price_breakdown ?? null);
    } catch {
      toast.error('Booking not found');
      router.push('/bookings');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/bookings/${bookingId}`);
      return;
    }

    if (isAuthenticated && bookingId) {
      fetchBooking();
    }
  }, [isAuthenticated, authLoading, bookingId, router, fetchBooking]);

  // The cancel response is a full BookingResource, so adopt it directly and
  // skip the refetch. price_breakdown is unaffected by cancelling.
  const handleCancelled = (cancelled: Booking) => setBooking(cancelled);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewData.comment?.trim()) {
      toast.error('Please write a short review');
      return;
    }

    setIsSubmittingReview(true);
    try {
      // POST /bookings/{id}/review → body: { rating, comment }
      await reviewsApi.create(bookingId, reviewData);
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      fetchBooking();
    } catch {
      // Error handled by interceptor
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const response = await invoicesApi.download(bookingId);
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${booking?.booking_reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
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

  const { hotel, room, payment } = booking;
  const needsPayment =
    booking.status === 'pending' && (!payment || payment.status !== 'completed');
  const canReview = booking.status === 'checked_out' && !booking.review;
  const price = priceBreakdown ?? getBookingPriceBreakdown(booking);
  const cancelBlockedReason = cancellationBlockedReason(booking);

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
              <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800 flex items-center px-6">
                <span className="text-3xl font-bold text-white/90">
                  {hotel?.name?.charAt(0)?.toUpperCase() || 'H'}
                </span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-secondary-900">{hotel?.name}</h2>
                <p className="text-primary-600 font-medium mt-1">{room?.room_type}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-secondary-500">
                  <span className="flex items-center gap-2">
                    <FiMapPin />
                    {hotel?.city}
                  </span>
                  <span className="flex items-center gap-2">
                    <FiHome />
                    Room {room?.room_number} · Floor {room?.floor}
                  </span>
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
                </div>

                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Check Out</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiCalendar className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{formatDate(booking.check_out)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Guests</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiUsers className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{booking.guests_count}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wide">Nights</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiClock className="text-primary-500" />
                    <p className="font-medium text-secondary-900">{booking.nights}</p>
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
              <PaymentForm booking={booking} onPaymentSuccess={fetchBooking} />
            )}

            {/* Review Form — the API only accepts rating + comment */}
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
                      <label className="label">Review *</label>
                      <textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData((prev) => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        maxLength={1000}
                        placeholder="Tell us about your stay..."
                        className="input-field resize-none"
                        required
                      />
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
                <p className="text-sm text-secondary-600 mt-2">{booking.review.comment}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Booking Reference */}
            <div className="bg-white rounded-2xl border border-secondary-100 p-6">
              <p className="text-xs text-secondary-400 uppercase tracking-wide mb-1">Booking Reference</p>
              <p className="text-lg font-mono font-bold text-secondary-900">{booking.booking_reference}</p>
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
                    {formatCurrency(price.price_per_night)} × {price.nights}{' '}
                    {price.nights === 1 ? 'night' : 'nights'}
                  </span>
                  <span>{formatCurrency(price.base_price)}</span>
                </div>
                {price.extra_guest_charge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-secondary-500">
                      Extra {price.extra_guests === 1 ? 'guest' : 'guests'} ({price.extra_guests})
                    </span>
                    <span>{formatCurrency(price.extra_guest_charge)}</span>
                  </div>
                )}
                {price.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Taxes &amp; fees ({price.tax_rate})</span>
                    <span>{formatCurrency(price.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-secondary-100">
                  <span>Total</span>
                  <span className="text-primary-700">{formatCurrency(booking.total_price)}</span>
                </div>
              </div>

              {/* Payment Status */}
              {payment && (
                <div className="mt-4 pt-4 border-t border-secondary-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-500">Payment</span>
                    <Badge status={payment.status} size="sm" />
                  </div>
                  {payment.paid_at && (
                    <p className="text-xs text-secondary-400">
                      Paid on {formatDate(payment.paid_at)} · {payment.method}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {/* Invoices are only generated for completed payments */}
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

              {/* `is_cancellable` is computed by the API (Booking::isCancellable) */}
              {booking.is_cancellable ? (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setShowCancelModal(true)}
                  leftIcon={<FiX />}
                >
                  Cancel Booking
                </Button>
              ) : (
                // Don't just hide the button — an upcoming booking with no
                // cancel control looks broken unless we say why it's gone.
                cancelBlockedReason && (
                  <p className="text-xs text-secondary-500 bg-secondary-50 rounded-xl p-3 leading-relaxed">
                    {cancelBlockedReason}
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelBookingDialog
          booking={booking}
          onClose={() => setShowCancelModal(false)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}
