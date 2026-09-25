'use client';

import React, { useState } from 'react';
import { Booking, PaymentIntent, PaymentStatusResponse } from '@/types';
import { getApiErrorMessage, getApiErrorStatus, paymentsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import {
  FiCreditCard,
  FiShield,
  FiRefreshCw,
  FiExternalLink,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaStripe } from 'react-icons/fa';

interface PaymentFormProps {
  booking: Booking;
  onPaymentSuccess: () => void;
}

/**
 * Payment flow implemented by the API (PaymentController + WebhookController):
 *
 *   1. POST /bookings/{id}/pay  → creates a Stripe PaymentIntent and returns
 *                                 { client_secret, payment_id, amount }
 *   2. The card is charged through Stripe using that client_secret.
 *   3. Stripe calls POST /webhooks/stripe, which marks the payment as
 *      `completed` and the booking as `confirmed`.
 *
 * So this component never "completes" a payment itself — it creates the
 * intent and then polls GET /bookings/{id}/payment-status.
 */
export default function PaymentForm({ booking, onPaymentSuccess }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gatewayDown, setGatewayDown] = useState(false);

  const handleCreateIntent = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await paymentsApi.pay(booking.id);
      const data: PaymentIntent = response.data?.data ?? response.data;
      setIntent(data);
      toast.success('Payment started — complete the card payment to confirm.');
    } catch (err) {
      const status = getApiErrorStatus(err);

      /**
       * A 5xx here is not something the guest can fix by retrying.
       * `PaymentService` calls `Stripe::setApiKey(config('services.stripe.secret'))`
       * and then `PaymentIntent::create()`. If STRIPE_SECRET is unset the SDK
       * throws AuthenticationException, and neither the service, the
       * controller nor `bootstrap/app.php` catches it — so it escapes as a
       * bare 500. Say so, rather than inviting the guest to try again.
       */
      if (status >= 500) {
        setGatewayDown(true);
        setError(
          'Payments are unavailable right now — the server could not reach the payment provider. ' +
            'Your booking is safe and still held; nothing has been charged.',
        );
      } else if (status === 0) {
        setError('Could not reach the server. Check your connection and try again.');
      } else {
        setError(getApiErrorMessage(err, 'Could not start the payment.'));
      }

      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const response = await paymentsApi.getStatus(booking.id);
      const data: PaymentStatusResponse = response.data?.data ?? response.data;

      if (data?.payment?.status === 'completed') {
        toast.success('Payment confirmed!');
        onPaymentSuccess();
      } else {
        toast('Payment is still pending.', { icon: '⏳' });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not check the payment status.'));
      console.error('Payment status error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-secondary-100 p-6">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <FiCreditCard className="text-primary-500" />
        Payment
      </h3>

      <div className="bg-primary-50 rounded-xl p-4 mb-6 text-center">
        <p className="text-sm text-primary-600 mb-1">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary-700">
          {formatCurrency(booking.total_price)}
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary-500 bg-primary-50 mb-6">
        <FaStripe className="text-3xl text-[#635bff]" />
        <div className="flex-1">
          <p className="font-medium text-secondary-900">Credit / Debit Card</p>
          <p className="text-xs text-secondary-500">
            Processed securely by Stripe
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2.5 mb-4"
        >
          <FiAlertCircle className="mt-0.5 flex-shrink-0 text-danger-500" />
          <div className="text-sm text-danger-700">
            <p>{error}</p>
            {gatewayDown && (
              <p className="mt-1 text-xs text-danger-600">
                If you are running this API yourself, set <code>STRIPE_SECRET</code> in
                its <code>.env</code> and restart it.
              </p>
            )}
          </div>
        </div>
      )}

      {intent ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-4 space-y-1">
            <p className="text-sm font-medium text-secondary-900">
              Payment intent created
            </p>
            <p className="text-xs text-secondary-500">
              Reference:{' '}
              <span className="font-mono text-secondary-700">{intent.payment_id}</span>
            </p>
            <p className="text-xs text-secondary-500">
              Finish the card payment with Stripe. Your booking is confirmed
              automatically as soon as Stripe notifies the API.
            </p>
          </div>

          <Button
            onClick={handleCheckStatus}
            isLoading={isChecking}
            variant="outline"
            fullWidth
            leftIcon={<FiRefreshCw />}
          >
            I&apos;ve paid — refresh status
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleCreateIntent}
          isLoading={isProcessing}
          disabled={gatewayDown}
          fullWidth
          size="lg"
          leftIcon={<FiExternalLink />}
        >
          {gatewayDown
            ? 'Payments unavailable'
            : `Pay ${formatCurrency(booking.total_price)}`}
        </Button>
      )}

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-secondary-400">
        <FiShield className="text-success-500" />
        <span>Your payment is secured with 256-bit encryption</span>
      </div>
    </div>
  );
}
