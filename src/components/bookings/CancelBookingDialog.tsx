'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Booking } from '@/types';
import { bookingsApi, getApiErrorMessage, getApiErrorStatus } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';

/** BookingController@cancel: 'reason' => ['nullable', 'string', 'max:500'] */
const REASON_MAX_LENGTH = 500;

interface CancelBookingDialogProps {
  booking: Booking;
  onClose: () => void;
  /** Receives the cancelled booking returned by the API. */
  onCancelled: (booking: Booking) => void;
}

/**
 * Confirmation dialog for `POST /bookings/{id}/cancel`.
 *
 * Shared by the bookings list and the booking detail page so the two cannot
 * drift apart on wording, validation limits or error handling.
 *
 * Render it conditionally rather than passing an `isOpen` flag: mounting on
 * open is what guarantees a fresh reason box and no stale error from the last
 * attempt, with no reset effect to keep in sync.
 */
export default function CancelBookingDialog({
  booking,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (isCancelling) return; // never abandon an in-flight request
    onClose();
  }, [isCancelling, onClose]);

  // Escape to dismiss, and stop the page behind the dialog from scrolling.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  const isPaid = booking.payment?.status === 'completed';

  const handleConfirm = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      // POST /bookings/{id}/cancel → body: { reason }
      const response = await bookingsApi.cancel(booking.id, reason.trim() || undefined);
      const cancelled: Booking = response.data?.data ?? response.data;

      toast.success('Booking cancelled');
      onCancelled(cancelled ?? { ...booking, status: 'cancelled', is_cancellable: false });
      onClose();
    } catch (err) {
      const status = getApiErrorStatus(err);

      if (status === 422) {
        // BookingService::cancelBooking() re-checks isCancellable() server-side.
        // Reaching here means the window closed (or someone else cancelled)
        // since this page was loaded, so retrying cannot help.
        setError(
          getApiErrorMessage(err, 'This booking can no longer be cancelled.'),
        );
      } else if (status === 403) {
        setError('This booking belongs to another account.');
      } else if (status === 404) {
        setError('This booking no longer exists.');
      } else if (status >= 500) {
        setError(
          'The server could not process the cancellation. Your booking is unchanged — please try again shortly.',
        );
      } else {
        setError(getApiErrorMessage(err, 'Could not cancel this booking.'));
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-danger-50 rounded-full flex items-center justify-center flex-shrink-0">
            <FiAlertCircle className="text-danger-500 text-xl" />
          </div>
          <h3 id="cancel-booking-title" className="text-lg font-semibold text-secondary-900">
            Cancel this booking?
          </h3>
        </div>

        {/* Say which booking, so this is never ambiguous when opened from a list. */}
        <div className="bg-secondary-50 rounded-xl p-3 mb-4 text-sm">
          <p className="font-medium text-secondary-900">{booking.hotel?.name}</p>
          <p className="text-secondary-500">
            {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
            {booking.room?.room_type ? ` · ${booking.room.room_type}` : ''}
          </p>
          <p className="text-secondary-400 text-xs mt-1 font-mono">
            {booking.booking_reference}
          </p>
        </div>

        <p className="text-sm text-secondary-500 mb-4">
          This releases the room and cannot be undone.
        </p>

        {/* The API's cancelBooking() has no refund logic: a completed payment
            keeps its `completed` status. Promising a refund here would be a lie. */}
        {isPaid && (
          <div className="flex gap-2.5 bg-warning-50 border border-warning-200 rounded-xl p-3 mb-4">
            <FiAlertTriangle className="text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-800">
              You have already paid{' '}
              <span className="font-medium">{formatCurrency(booking.total_price)}</span>.
              Cancelling here does not issue a refund automatically — the hotel
              handles that separately under its refund policy.
            </p>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="cancel-reason" className="label">
            Reason <span className="text-secondary-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="cancel-reason"
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={REASON_MAX_LENGTH}
            disabled={isCancelling}
            placeholder="Plans changed, found somewhere else…"
            className="input-field resize-none"
          />
          <p className="text-xs text-secondary-400 mt-1 text-right">
            {reason.length}/{REASON_MAX_LENGTH}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex gap-2.5 bg-danger-50 border border-danger-200 rounded-xl p-3 mb-4"
          >
            <FiAlertCircle className="text-danger-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={handleConfirm}
            isLoading={isCancelling}
            fullWidth
          >
            {isCancelling ? 'Cancelling…' : 'Yes, cancel booking'}
          </Button>
          <Button variant="ghost" onClick={close} disabled={isCancelling} fullWidth>
            Keep booking
          </Button>
        </div>
      </div>
    </div>
  );
}
