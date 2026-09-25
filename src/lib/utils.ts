import { clsx, type ClassValue } from 'clsx';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { STORAGE_BASE_URL } from '@/lib/config';
import type { ApiImage, Booking, Hotel, PriceBreakdown, RoomType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Safely coerce any backend value (number, numeric string, null) to a number.
 * Laravel returns `decimal` columns as strings unless they are cast.
 */
export function toNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num =
    typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : Number(value);
  return isNaN(num) ? fallback : num;
}

// ═══════════════════════════════════════════
// PRICING — mirrors app/Services/PricingService.php
// ═══════════════════════════════════════════

/** PricingService::TAX_RATE */
export const TAX_RATE = 0.12;
/** PricingService::EXTRA_GUEST_RATE */
export const EXTRA_GUEST_RATE = 0.2;
/** PricingService::BASE_CAPACITY */
export const BASE_CAPACITY = 2;

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Reproduce the API's price breakdown locally so the booking summary shown
 * before submitting matches the total the backend will charge.
 */
export function calculatePricing(
  pricePerNight: number,
  nights: number,
  guests: number = 1,
): PriceBreakdown {
  const rate = Math.max(toNumber(pricePerNight), 0);
  const safeNights = Math.max(Math.round(nights) || 1, 1);
  const extraGuests = Math.max(guests - BASE_CAPACITY, 0);

  const basePrice = rate * safeNights;
  const extraGuestCharge = extraGuests * (rate * EXTRA_GUEST_RATE) * safeNights;
  const subtotal = basePrice + extraGuestCharge;
  const tax = subtotal * TAX_RATE;

  return {
    price_per_night: rate,
    nights: safeNights,
    base_price: round2(basePrice),
    extra_guests: extraGuests,
    extra_guest_charge: round2(extraGuestCharge),
    subtotal: round2(subtotal),
    tax_rate: `${TAX_RATE * 100}%`,
    tax: round2(tax),
    total: round2(subtotal + tax),
  };
}

/**
 * Build a breakdown for an existing booking.
 *
 * `BookingResource` exposes `room.price_per_night`, `nights`, `guests_count`
 * and the authoritative `total_price`; the intermediate figures are derived
 * and then reconciled against the stored total.
 */
export function getBookingPriceBreakdown(booking?: Booking | null): PriceBreakdown {
  if (!booking) return calculatePricing(0, 1, 1);

  const nights =
    toNumber(booking.nights) || calculateNights(booking.check_in, booking.check_out);

  const breakdown = calculatePricing(
    toNumber(booking.room?.price_per_night),
    nights,
    toNumber(booking.guests_count, 1),
  );

  const total = toNumber(booking.total_price);
  if (total <= 0 || Math.abs(total - breakdown.total) < 0.01) return breakdown;

  // Trust the stored total (seasonal rates, manual adjustments, …).
  const subtotal = round2(total / (1 + TAX_RATE));
  return {
    ...breakdown,
    subtotal,
    tax: round2(total - subtotal),
    total: round2(total),
  };
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const validNum = toNumber(amount);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(validNum);
}

/** Nightly rate of a room type (`RoomTypeResource.price_per_night`). */
export function getRoomPrice(roomType?: Partial<RoomType> | null): number {
  return toNumber(roomType?.price_per_night);
}

/**
 * Cheapest nightly rate for a hotel.
 * `HotelResource` exposes `starting_price` when room types are loaded;
 * otherwise fall back to the loaded `room_types`.
 */
export function getHotelMinPrice(hotel?: Partial<Hotel> | null): number {
  if (!hotel) return 0;

  const startingPrice = toNumber(hotel.starting_price);
  if (startingPrice > 0) return startingPrice;

  const prices = (hotel.room_types ?? [])
    .map((roomType) => getRoomPrice(roomType))
    .filter((price) => price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function formatDate(date?: string | Date | null, formatStr: string = 'MMM dd, yyyy'): string {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '';
    return format(parsedDate, formatStr);
  } catch {
    return '';
  }
}

/**
 * The reviews endpoints return `created_at` already humanised
 * (`diffForHumans()` → "2 days ago"), so only format real dates.
 */
export function formatMaybeDate(value?: string | null): string {
  if (!value) return '';
  const formatted = formatDate(value);
  return formatted || value;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function calculateNights(checkIn?: string | Date, checkOut?: string | Date): number {
  if (!checkIn || !checkOut) return 1;
  try {
    const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
    const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
    if (!isValid(start) || !isValid(end)) return 1;
    const diff = differenceInDays(end, start);
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

/** Add `days` to an ISO `yyyy-MM-dd` string. */
export function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00`);
  if (Number.isNaN(next.getTime())) return date;
  next.setDate(next.getDate() + days);
  return format(next, 'yyyy-MM-dd');
}

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80';

/**
 * Resolve an image to a URL.
 *
 * The API returns `{ url, thumbnail_url }` objects (Hotel::images_with_urls)
 * or an absolute string (`cover_image`). Raw storage paths are still handled
 * for safety.
 */
export function getImageUrl(
  imageSource?: ApiImage | string | Array<ApiImage | string> | null,
  variant: 'url' | 'thumbnail_url' = 'url',
): string {
  if (!imageSource) return PLACEHOLDER_IMAGE;

  if (Array.isArray(imageSource)) {
    return imageSource.length > 0 ? getImageUrl(imageSource[0], variant) : PLACEHOLDER_IMAGE;
  }

  let pathStr =
    typeof imageSource === 'string'
      ? imageSource
      : imageSource[variant] || imageSource.url || '';

  if (typeof pathStr !== 'string') return PLACEHOLDER_IMAGE;

  pathStr = pathStr.trim();
  if (!pathStr || pathStr === 'undefined' || pathStr === 'null') {
    return PLACEHOLDER_IMAGE;
  }

  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }

  return `${STORAGE_BASE_URL}/${pathStr.replace(/^\/+/, '')}`;
}

/** First usable image of a hotel — `cover_image` falls back to `images[0]`. */
export function getHotelImage(hotel?: Partial<Hotel> | null): string {
  if (!hotel) return PLACEHOLDER_IMAGE;
  return getImageUrl(hotel.cover_image || hotel.images?.[0]);
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    checked_in: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    checked_out: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    refunded: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  };
  return colors[status] || colors.pending;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    cancelled: 'Cancelled',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

/**
 * `GET /search` requires `check_in` to be AFTER today, so the default range
 * starts tomorrow.
 */
/**
 * BookingController@store validates `guests_count` with `min:1|max:10`, so no
 * picker should ever offer a value the API will reject.
 */
export const MAX_GUESTS_PER_BOOKING = 10;

/**
 * Coerce anything (query string, <select> value, undefined) into a guest count
 * the API will accept.
 *
 * `parseInt` returns NaN for '', 'abc' and 'NaN'. A NaN here is not harmless:
 * `JSON.stringify({ guests_count: NaN })` produces `{"guests_count":null}`,
 * and Laravel then answers "The guests count field is required." — an error
 * message that points nowhere near the real problem.
 */
export function parseGuests(value: unknown, fallback = 2): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_GUESTS_PER_BOOKING);
}

/** `[1, 2, … n]` for a guest <select>. Always at least one option. */
export function guestOptions(max: number = MAX_GUESTS_PER_BOOKING): number[] {
  const limit = Number.isFinite(max)
    ? Math.min(Math.max(Math.trunc(max), 1), MAX_GUESTS_PER_BOOKING)
    : MAX_GUESTS_PER_BOOKING;

  return Array.from({ length: limit }, (_, index) => index + 1);
}

/**
 * How many guests a room type sleeps.
 *
 * When the API omits `capacity` we must not invent a small number — silently
 * assuming 2 is what made the booking form offer fewer guests than the page
 * above it. Fall back to the API maximum and let the server decide.
 */
export function getRoomCapacity(roomType?: { capacity?: number | null } | null): number {
  const capacity = Number(roomType?.capacity);

  return Number.isFinite(capacity) && capacity > 0
    ? Math.min(Math.trunc(capacity), MAX_GUESTS_PER_BOOKING)
    : MAX_GUESTS_PER_BOOKING;
}

export function generateBookingDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  return {
    /** The earliest date the API accepts as a check-in. */
    minCheckIn: format(tomorrow, 'yyyy-MM-dd'),
    defaultCheckIn: format(tomorrow, 'yyyy-MM-dd'),
    defaultCheckOut: format(dayAfterTomorrow, 'yyyy-MM-dd'),
  };
}

export const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶',
  parking: '🅿️',
  pool: '🏊',
  gym: '💪',
  spa: '💆',
  restaurant: '🍽️',
  bar: '🍸',
  room_service: '🛎️',
  laundry: '👔',
  airport_shuttle: '✈️',
  pet_friendly: '🐾',
  business_center: '💼',
  concierge: '🔑',
  air_conditioning: '❄️',
  ac: '❄️',
  heating: '🔥',
  kitchen: '🍳',
  tv: '📺',
  minibar: '🍫',
  balcony: '🏞️',
  ocean_view: '🌊',
};
