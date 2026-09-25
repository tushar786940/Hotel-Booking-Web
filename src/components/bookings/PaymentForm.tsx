'use client';

import React, { useState } from 'react';
import { Booking } from '@/types';
import { paymentsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { FiCreditCard, FiShield } from 'react-icons/fi';
import { FaStripe, FaPaypal } from 'react-icons/fa';

interface PaymentFormProps {
  booking: Booking;
  onPaymentSuccess: () => void;
}

export default function PaymentForm({ booking, onPaymentSuccess }: PaymentFormProps) {
  const [method, setMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await paymentsApi.pay(booking.id, { method });
      toast.success('Payment completed successfully!');
      onPaymentSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
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

      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-secondary-700">Select Payment Method</p>

        <label
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            method === 'stripe'
              ? 'border-primary-500 bg-primary-50'
              : 'border-secondary-200 hover:border-secondary-300'
          }`}
        >
          <input
            type="radio"
            name="method"
            value="stripe"
            checked={method === 'stripe'}
            onChange={() => setMethod('stripe')}
            className="sr-only"
          />
          <FaStripe className="text-3xl text-[#635bff]" />
          <div className="flex-1">
            <p className="font-medium text-secondary-900">Credit / Debit Card</p>
            <p className="text-xs text-secondary-500">Pay securely with Stripe</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            method === 'stripe' ? 'border-primary-500' : 'border-secondary-300'
          }`}>
            {method === 'stripe' && (
              <div className="w-3 h-3 rounded-full bg-primary-500" />
            )}
          </div>
        </label>

        <label
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
            method === 'paypal'
              ? 'border-primary-500 bg-primary-50'
              : 'border-secondary-200 hover:border-secondary-300'
          }`}
        >
          <input
            type="radio"
            name="method"
            value="paypal"
            checked={method === 'paypal'}
            onChange={() => setMethod('paypal')}
            className="sr-only"
          />
          <FaPaypal className="text-3xl text-[#003087]" />
          <div className="flex-1">
            <p className="font-medium text-secondary-900">PayPal</p>
            <p className="text-xs text-secondary-500">Pay with your PayPal account</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            method === 'paypal' ? 'border-primary-500' : 'border-secondary-300'
          }`}>
            {method === 'paypal' && (
              <div className="w-3 h-3 rounded-full bg-primary-500" />
            )}
          </div>
        </label>
      </div>

      <Button
        onClick={handlePayment}
        isLoading={isProcessing}
        fullWidth
        size="lg"
        leftIcon={<FiCreditCard />}
      >
        Pay {formatCurrency(booking.total_price)}
      </Button>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-secondary-400">
        <FiShield className="text-success-500" />
        <span>Your payment is secured with 256-bit encryption</span>
      </div>
    </div>
  );
}